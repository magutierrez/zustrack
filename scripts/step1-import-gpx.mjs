#!/usr/bin/env node
/**
 * Step 1 — Import GPX files into Supabase
 *
 * Parses GPX files from a local directory and upserts them into the `trails`
 * table. No external APIs are called — this step is fast (~1 000 trails in
 * under 30 s). Region/place and OSM data are filled by step2 and step3.
 *
 * Usage:
 *   node scripts/step1-import-gpx.mjs --dir ./gpx_trails --country es [--dry-run] [--limit N] [--skip-existing]
 *
 * Flags:
 *   --dir             Directory with .gpx files (default: ./gpx_trails)
 *   --country         Country code to store (default: es)
 *   --dry-run         Print rows without writing to Supabase
 *   --limit N         Process at most N files
 *   --skip-existing   Skip files whose numeric ID already exists in Supabase
 *
 * Required env vars (from .env.local):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { DOMParser } from '@xmldom/xmldom';
import { haversineKm, createSupabase, parseCLIArgs } from './lib.mjs';

const { country, dir, limit, dryRun, skipExisting } = parseCLIArgs();
const BATCH_SIZE = 50;

// ---------------------------------------------------------------------------
// GPX helpers
// ---------------------------------------------------------------------------

function getTextContent(doc, ...tags) {
  for (const tag of tags) {
    const els = doc.getElementsByTagName(tag);
    if (els.length > 0 && els[0].textContent?.trim()) return els[0].textContent.trim();
  }
  return null;
}

function extractId(filename) {
  const match = filename.match(/_(\d+)\.gpx$/i);
  return match ? parseInt(match[1], 10) : null;
}

function extractTrailCode(name) {
  const match = name.match(/\b(GR|PR|SL)-((?:[A-Z]{1,3}-)?(?:\d+(?:\.\d+)*))/i);
  return match ? `${match[1].toUpperCase()}-${match[2].toUpperCase()}` : null;
}

function routeTypeFromCode(trailCode) {
  if (!trailCode) return 'unknown';
  if (trailCode.startsWith('GR')) return 'GR';
  if (trailCode.startsWith('PR')) return 'PR';
  if (trailCode.startsWith('SL')) return 'SL';
  return 'unknown';
}

function bestSeason(avgElev, maxElev) {
  if (maxElev !== null && maxElev > 2500) return 'avoid_winter';
  if (avgElev !== null && avgElev > 2000) return 'avoid_summer';
  return 'year_round';
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function smoothElevation(values, window = 5) {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    const slice = values.slice(start, end).filter((v) => v !== null && !isNaN(v));
    return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : values[i];
  });
}

function parseTrkpts(doc) {
  const trkpts = doc.getElementsByTagName('trkpt');
  const points = [];
  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat') ?? '');
    const lon = parseFloat(pt.getAttribute('lon') ?? '');
    if (isNaN(lat) || isNaN(lon)) continue;
    const eleEls = pt.getElementsByTagName('ele');
    const eleRaw = eleEls.length > 0 && eleEls[0].textContent ? parseFloat(eleEls[0].textContent) : NaN;
    points.push({ lat, lon, ele: isNaN(eleRaw) ? null : eleRaw });
  }
  return points;
}

function sampleTrackPoints(points, cumulativeDists, maxPoints) {
  if (points.length === 0) return [];
  if (points.length <= maxPoints) {
    return points.map((p, i) => ({
      lat: Math.round(p.lat * 1e6) / 1e6,
      lng: Math.round(p.lon * 1e6) / 1e6,
      d:   Math.round(cumulativeDists[i] * 1000) / 1000,
      e:   p.ele !== null ? Math.round(p.ele) : null,
    }));
  }
  const result = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i / (maxPoints - 1)) * (points.length - 1));
    const p = points[idx];
    result.push({
      lat: Math.round(p.lat * 1e6) / 1e6,
      lng: Math.round(p.lon * 1e6) / 1e6,
      d:   Math.round(cumulativeDists[idx] * 1000) / 1000,
      e:   p.ele !== null ? Math.round(p.ele) : null,
    });
  }
  return result;
}

function computeSlopeBreakdown(trackProfile) {
  if (!trackProfile || trackProfile.length < 2) return null;
  let flat = 0, gentle = 0, steep = 0, extreme = 0, total = 0;
  for (let i = 1; i < trackProfile.length; i++) {
    const prev = trackProfile[i - 1];
    const curr = trackProfile[i];
    const segDistKm = curr.d - prev.d;
    if (segDistKm <= 0) continue;
    total += segDistKm;
    if (prev.e !== null && curr.e !== null) {
      const slopePct = Math.abs((curr.e - prev.e) / (segDistKm * 1000)) * 100;
      if (slopePct <= 1) flat += segDistKm;
      else if (slopePct <= 5) gentle += segDistKm;
      else if (slopePct <= 10) steep += segDistKm;
      else extreme += segDistKm;
    } else {
      flat += segDistKm;
    }
  }
  if (total === 0) return null;
  return {
    flat:    Math.round((flat    / total) * 100),
    gentle:  Math.round((gentle  / total) * 100),
    steep:   Math.round((steep   / total) * 100),
    extreme: Math.round((extreme / total) * 100),
  };
}

function analyzeGPX(gpxContent, filename) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxContent, 'text/xml');

  const name =
    getTextContent(doc, 'name') ??
    basename(filename, '.gpx')
      .replace(/^Archivo\s+/i, '')
      .replace(/_\d+$/, '')
      .trim();

  const description = getTextContent(doc, 'desc');
  const source = getTextContent(doc, 'src');

  const rawPoints = parseTrkpts(doc);
  if (rawPoints.length < 2) return null;

  const waypointCount = doc.getElementsByTagName('wpt').length;
  const pointCount = rawPoints.length;

  const rawEles = rawPoints.map((p) => p.ele);
  const smoothedEles = smoothElevation(rawEles, 5);
  const points = rawPoints.map((p, i) => ({ ...p, ele: smoothedEles[i] }));

  let distanceKm = 0, elevGain = 0, elevLoss = 0, maxSlope = 0;
  const eles = points.map((p) => p.ele).filter((e) => e !== null);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const segDistKm = haversineKm(prev.lat, prev.lon, curr.lat, curr.lon);
    distanceKm += segDistKm;
    if (prev.ele !== null && curr.ele !== null) {
      const diff = curr.ele - prev.ele;
      if (diff > 2) elevGain += diff;
      else if (diff < -2) elevLoss += Math.abs(diff);
      if (segDistKm > 0.001) {
        const slopePct = Math.abs((diff / (segDistKm * 1000)) * 100);
        if (slopePct < 150 && slopePct > maxSlope) maxSlope = slopePct;
      }
    }
  }

  const elevMax = eles.length ? Math.max(...eles) : null;
  const elevMin = eles.length ? Math.min(...eles) : null;
  const avgElev = eles.length ? eles.reduce((a, b) => a + b, 0) / eles.length : null;

  const start = points[0];
  const end   = points[points.length - 1];
  const lats  = points.map((p) => p.lat);
  const lons  = points.map((p) => p.lon);
  const isCircular = haversineKm(start.lat, start.lon, end.lat, end.lon) < 0.5;

  const estimatedDurationMin = Math.round((distanceKm / 4) * 60 + elevGain / 10);

  const distScore  = Math.min(1, distanceKm / 40) * 40;
  const gainScore  = Math.min(1, elevGain    / 2000) * 40;
  const slopeScore = Math.min(1, maxSlope    / 50) * 20;
  const difficultyScore = Math.round((distScore + gainScore + slopeScore) * 10) / 10;

  let effortLevel;
  if (difficultyScore < 25) effortLevel = 'easy';
  else if (difficultyScore < 50) effortLevel = 'moderate';
  else if (difficultyScore < 75) effortLevel = 'hard';
  else effortLevel = 'very_hard';

  const trailCode = extractTrailCode(name);

  const cumulativeDists = [0];
  for (let i = 1; i < points.length; i++) {
    cumulativeDists.push(
      cumulativeDists[i - 1] + haversineKm(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon),
    );
  }

  return {
    name,
    description,
    source,
    trail_code:             trailCode,
    route_type:             routeTypeFromCode(trailCode),
    distance_km:            Math.round(distanceKm * 100) / 100,
    elevation_max_m:        elevMax !== null ? Math.round(elevMax * 10) / 10 : null,
    elevation_min_m:        elevMin !== null ? Math.round(elevMin * 10) / 10 : null,
    elevation_gain_m:       Math.round(elevGain),
    elevation_loss_m:       Math.round(elevLoss),
    avg_elevation_m:        avgElev !== null ? Math.round(avgElev) : null,
    max_slope_pct:          Math.round(maxSlope * 10) / 10,
    is_circular:            isCircular,
    start_lat:              Math.round(start.lat * 1e7) / 1e7,
    start_lng:              Math.round(start.lon * 1e7) / 1e7,
    end_lat:                Math.round(end.lat   * 1e7) / 1e7,
    end_lng:                Math.round(end.lon   * 1e7) / 1e7,
    bbox_min_lat:           Math.round(Math.min(...lats) * 1e7) / 1e7,
    bbox_max_lat:           Math.round(Math.max(...lats) * 1e7) / 1e7,
    bbox_min_lng:           Math.round(Math.min(...lons) * 1e7) / 1e7,
    bbox_max_lng:           Math.round(Math.max(...lons) * 1e7) / 1e7,
    estimated_duration_min: estimatedDurationMin,
    difficulty_score:       difficultyScore,
    effort_level:           effortLevel,
    child_friendly:         distanceKm <= 8 && elevGain <= 300 && maxSlope <= 20,
    pet_friendly:           distanceKm <= 15 && elevGain <= 600,
    season_best:            bestSeason(avgElev, elevMax),
    point_count:            pointCount,
    waypoint_count:         waypointCount,
    track_profile:          sampleTrackPoints(points, cumulativeDists, 300),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🥾 Step 1 — Import GPX');
  console.log(`   Country       : ${country}`);
  console.log(`   Dir           : ${dir}`);
  console.log(`   Dry run       : ${dryRun}`);
  console.log(`   Limit         : ${limit ?? 'all'}`);
  console.log(`   Skip existing : ${skipExisting}\n`);

  let supabase = null;
  if (!dryRun) supabase = createSupabase();

  // Optionally pre-load existing IDs
  let existingIds = new Set();
  if (skipExisting && supabase) {
    console.log('   Loading existing IDs from Supabase...');
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('trails')
        .select('id')
        .eq('country', country)
        .range(from, from + PAGE - 1);
      if (error) { console.error('Failed to load existing IDs:', error.message); process.exit(1); }
      if (!data || data.length === 0) break;
      data.forEach((r) => existingIds.add(r.id));
      if (data.length < PAGE) break;
      from += PAGE;
    }
    console.log(`   Found ${existingIds.size} existing trails in Supabase\n`);
  }

  let allFiles;
  try {
    allFiles = await readdir(dir);
  } catch {
    console.error(`Error: cannot read directory "${dir}"`);
    process.exit(1);
  }

  const gpxFiles = allFiles.filter((f) => f.toLowerCase().endsWith('.gpx'));
  const files = limit ? gpxFiles.slice(0, limit) : gpxFiles;
  console.log(`Found ${files.length} GPX files (${gpxFiles.length} total)\n`);

  let success = 0, errors = 0, skipped = 0;
  const batch = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const id = extractId(filename);

    if (!id) {
      console.warn(`  ⚠  Skipped (no ID in filename): ${filename}`);
      skipped++;
      continue;
    }

    if (skipExisting && existingIds.has(id)) {
      skipped++;
      continue;
    }

    try {
      const gpxContent = await readFile(join(dir, filename), 'utf-8');
      const metrics = analyzeGPX(gpxContent, filename);

      if (!metrics) {
        console.warn(`  ⚠  Skipped (< 2 track points): ${filename}`);
        skipped++;
        continue;
      }

      const slug = `${slugify(metrics.name)}-${id}`;
      const slopeBreakdown = computeSlopeBreakdown(metrics.track_profile);

      const row = {
        id,
        slug,
        country,
        gpx_file: filename,
        ...metrics,
        slope_breakdown: slopeBreakdown,
        // OSM / geocode fields — filled by step2 + step3
        region:               null,
        place:                null,
        dominant_surface:     null,
        surface_breakdown:    null,
        dominant_path_type:   null,
        path_type_breakdown:  null,
        escape_points:        null,
        water_sources:        null,
      };

      if (dryRun) {
        if (i < 5) {
          console.log(`\n--- ${filename}`);
          console.log(JSON.stringify({ ...row, track_profile: `[${row.track_profile.length} pts]` }, null, 2));
        }
        success++;
      } else {
        batch.push(row);
        if (batch.length >= BATCH_SIZE || i === files.length - 1) {
          const { error } = await supabase.from('trails').upsert(batch, { onConflict: 'id' });
          if (error) {
            console.error(`  ✗  Batch upsert error: ${error.message}`);
            errors += batch.length;
          } else {
            success += batch.length;
          }
          batch.length = 0;
        }
      }
    } catch (err) {
      console.error(`  ✗  Error processing "${filename}": ${err.message}`);
      errors++;
    }

    if ((i + 1) % 100 === 0) console.log(`  ⏳ Processed ${i + 1}/${files.length}...`);
  }

  console.log('\n✅ Done!');
  console.log(`   Success : ${success}`);
  console.log(`   Skipped : ${skipped}`);
  console.log(`   Errors  : ${errors}`);
  if (dryRun) console.log('\n   Run without --dry-run to write to Supabase.');
  console.log('\n👉 Next: node scripts/step2-geocode.mjs --country ' + country);
}

main();
