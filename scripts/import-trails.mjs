#!/usr/bin/env node
/**
 * Trail GPX Import Script
 *
 * Usage:
 *   node scripts/import-trails.mjs --country es --dir ./gpx_trails [--dry-run] [--limit 10]
 *
 * Required env vars (in .env.local or exported before running):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

// Some environments reject self-signed certs; disable for outbound requests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { createClient } from '@supabase/supabase-js';
import { DOMParser } from '@xmldom/xmldom';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const COUNTRY = getArg('--country') ?? 'es';
const DIR = getArg('--dir') ?? './gpx_trails';
const DRY_RUN = hasFlag('--dry-run');
const LIMIT = getArg('--limit') ? parseInt(getArg('--limit'), 10) : null;
const BATCH_SIZE = 50;

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------
let supabase = null;
if (!DRY_RUN) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }
  supabase = createClient(url, key);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Haversine distance in km */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Slugify: normalize unicode, lowercase, replace non-alphanumeric with dash */
function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Simple moving average to smooth GPS elevation noise */
function smoothElevation(values, window = 5) {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    const slice = values.slice(start, end).filter((v) => v !== null && !isNaN(v));
    return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : values[i];
  });
}

/** Extract numeric ID from filename: last `_DIGITS` before .gpx */
function extractId(filename) {
  const match = filename.match(/_(\d+)\.gpx$/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Extract trail code like GR-200, PR-BA-047, SL-GI-1002, GR-11.2 from name string */
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

/** Get text content from the first matching tag name */
function getTextContent(doc, ...tags) {
  for (const tag of tags) {
    const els = doc.getElementsByTagName(tag);
    if (els.length > 0 && els[0].textContent?.trim()) {
      return els[0].textContent.trim();
    }
  }
  return null;
}

/** Sleep for ms milliseconds */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Compute slope breakdown percentages from track_profile points */
function computeSlopeBreakdown(trackProfile) {
  if (!trackProfile || trackProfile.length < 2) return null;

  let flat = 0,
    gentle = 0,
    steep = 0,
    extreme = 0,
    total = 0;

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
      flat += segDistKm; // unknown elevation → assume flat
    }
  }

  if (total === 0) return null;
  return {
    flat: Math.round((flat / total) * 100),
    gentle: Math.round((gentle / total) * 100),
    steep: Math.round((steep / total) * 100),
    extreme: Math.round((extreme / total) * 100),
  };
}

/** Reverse-geocode start point via Nominatim to get region (state) and place (municipality) */
async function fetchNominatimGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'zustrackapp/1.0 (trail-import)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { region: null, place: null };
    const data = await res.json();
    const addr = data.address || {};
    const region = addr.state || addr.region || null;
    const place =
      addr.municipality || addr.city || addr.town || addr.village || addr.hamlet || null;
    return { region, place };
  } catch {
    return { region: null, place: null };
  }
}

/**
 * Query Overpass OSM for surface/path types, escape points, and water sources.
 * Uses the same query as app/api/route-info/route.ts.
 */
async function fetchOsmEnrichment(bbox, trackProfile) {
  const overpassQuery = `[out:json][timeout:30];
(
  way["highway"](${bbox});
  node["place"~"village|town|hamlet"](${bbox});
  way["highway"~"primary|secondary|tertiary"](${bbox});
  node["amenity"="drinking_water"](${bbox});
  node["natural"="spring"](${bbox});
  node["man_made"="water_tap"](${bbox});
  node["tourism"~"alpine_hut|wilderness_hut"](${bbox});
  way["tourism"~"alpine_hut|wilderness_hut"](${bbox});
);
out center;`;

  let elements = [];
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'zustrackapp/1.0',
      },
      signal: AbortSignal.timeout(35000),
    });
    if (response.ok) {
      const data = await response.json();
      elements = data.elements || [];
    }
  } catch (err) {
    console.warn(`    ⚠  Overpass error: ${err.message}`);
    return null;
  }

  // Distance in km between two lat/lon pairs (fast approximation, same as route-info)
  const distKm = (p1, p2) =>
    Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2)) * 111.32;

  const highwayEls = elements.filter((el) => el.tags?.highway);
  const escapeEls = elements.filter(
    (el) =>
      el.tags?.place ||
      (el.tags?.highway && ['primary', 'secondary'].includes(el.tags.highway)) ||
      (el.tags?.tourism && ['alpine_hut', 'wilderness_hut'].includes(el.tags.tourism)),
  );
  const waterEls = elements.filter(
    (el) =>
      el.tags?.amenity === 'drinking_water' ||
      el.tags?.natural === 'spring' ||
      el.tags?.man_made === 'water_tap',
  );

  // --- Surface and path type breakdown ---
  const surfaceCounts = {};
  const pathTypeCounts = {};
  let matchedPoints = 0;

  for (const tp of trackProfile) {
    let bestDist = Infinity;
    let bestEl = null;
    for (const el of highwayEls) {
      if (!el.center) continue;
      const d = distKm(tp, el.center);
      if (d < 0.1 && d < bestDist) {
        bestDist = d;
        bestEl = el;
      }
    }
    if (bestEl) {
      matchedPoints++;
      const surface =
        bestEl.tags.surface || (bestEl.tags.highway === 'cycleway' ? 'asphalt' : 'unknown');
      const pathType = bestEl.tags.highway || 'unknown';
      surfaceCounts[surface] = (surfaceCounts[surface] || 0) + 1;
      pathTypeCounts[pathType] = (pathTypeCounts[pathType] || 0) + 1;
    }
  }

  let dominantSurface = null,
    surfaceBreakdown = null;
  let dominantPathType = null,
    pathTypeBreakdown = null;

  if (matchedPoints > 0) {
    const toBreakdown = (counts) => {
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return Object.fromEntries(sorted.map(([k, v]) => [k, Math.round((v / matchedPoints) * 100)]));
    };
    surfaceBreakdown = toBreakdown(surfaceCounts);
    dominantSurface = Object.entries(surfaceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    pathTypeBreakdown = toBreakdown(pathTypeCounts);
    dominantPathType = Object.entries(pathTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  // --- Escape points (deduplicated, max 5) ---
  const seenEscape = new Set();
  const escapePoints = [];
  for (const tp of trackProfile) {
    for (const el of escapeEls) {
      const center = el.center || { lat: el.lat, lon: el.lon };
      if (!center) continue;
      const d = distKm(tp, { lat: center.lat, lng: center.lon });
      if (d > 2.5) continue;
      const key = `${Math.round(center.lat * 100)},${Math.round((center.lon ?? center.lng) * 100)}`;
      if (seenEscape.has(key)) continue;
      seenEscape.add(key);
      const tags = el.tags || {};
      escapePoints.push({
        lat: center.lat,
        lng: center.lon ?? center.lng,
        name:
          tags.name ||
          (tags.tourism ? 'Refugio' : tags.highway ? 'Carretera principal' : 'Núcleo urbano'),
        type: tags.tourism ? 'shelter' : tags.place ? 'town' : 'road',
        distanceFromRoute: Math.round(d * 10) / 10,
      });
      if (escapePoints.length >= 5) break;
    }
    if (escapePoints.length >= 5) break;
  }

  // --- Water sources (deduplicated, max 10) ---
  const seenWater = new Set();
  const waterSources = [];
  for (const tp of trackProfile) {
    for (const el of waterEls) {
      const center = el.center || { lat: el.lat, lon: el.lon };
      if (!center) continue;
      const d = distKm(tp, { lat: center.lat, lng: center.lon });
      if (d > 1.5) continue;
      const key = `${Math.round(center.lat * 100)},${Math.round((center.lon ?? center.lng) * 100)}`;
      if (seenWater.has(key)) continue;
      seenWater.add(key);
      const isNatural = el.tags?.natural === 'spring';
      const type = isNatural ? 'natural' : 'urban';
      // Simple reliability: natural springs = medium (seasonal), urban = high
      const reliability = isNatural ? 'medium' : 'high';
      waterSources.push({
        lat: center.lat,
        lng: center.lon ?? center.lng,
        name: el.tags?.name || (isNatural ? 'Manantial' : 'Fuente'),
        type,
        distanceFromRoute: Math.round(d * 10) / 10,
        reliability,
      });
      if (waterSources.length >= 10) break;
    }
    if (waterSources.length >= 10) break;
  }

  return {
    dominant_surface: dominantSurface,
    surface_breakdown: surfaceBreakdown,
    dominant_path_type: dominantPathType,
    path_type_breakdown: pathTypeBreakdown,
    escape_points: escapePoints.length > 0 ? escapePoints : null,
    water_sources: waterSources.length > 0 ? waterSources : null,
  };
}

/** Sample up to maxPoints evenly-spaced points from the track for the profile */
function sampleTrackPoints(points, cumulativeDists, maxPoints) {
  if (points.length === 0) return [];
  if (points.length <= maxPoints) {
    return points.map((p, i) => ({
      lat: Math.round(p.lat * 1e6) / 1e6,
      lng: Math.round(p.lon * 1e6) / 1e6,
      d: Math.round(cumulativeDists[i] * 1000) / 1000,
      e: p.ele !== null ? Math.round(p.ele) : null,
    }));
  }
  const result = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i / (maxPoints - 1)) * (points.length - 1));
    const p = points[idx];
    result.push({
      lat: Math.round(p.lat * 1e6) / 1e6,
      lng: Math.round(p.lon * 1e6) / 1e6,
      d: Math.round(cumulativeDists[idx] * 1000) / 1000,
      e: p.ele !== null ? Math.round(p.ele) : null,
    });
  }
  return result;
}

/** Parse all trkpt elements from a GPX document */
function parseTrkpts(doc) {
  let trkpts = doc.getElementsByTagName('trkpt');
  const points = [];
  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat') ?? '');
    const lon = parseFloat(pt.getAttribute('lon') ?? '');
    if (isNaN(lat) || isNaN(lon)) continue;

    const eleEls = pt.getElementsByTagName('ele');
    const eleRaw =
      eleEls.length > 0 && eleEls[0].textContent ? parseFloat(eleEls[0].textContent) : NaN;
    points.push({ lat, lon, ele: isNaN(eleRaw) ? null : eleRaw });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Core: analyze a single GPX file
// ---------------------------------------------------------------------------
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

  // Smooth elevation values to reduce GPS noise
  const rawEles = rawPoints.map((p) => p.ele);
  const smoothedEles = smoothElevation(rawEles, 5);
  const points = rawPoints.map((p, i) => ({ ...p, ele: smoothedEles[i] }));

  // Compute metrics
  let distanceKm = 0;
  let elevGain = 0;
  let elevLoss = 0;
  let maxSlope = 0;

  const eles = points.map((p) => p.ele).filter((e) => e !== null);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const segDistKm = haversineKm(prev.lat, prev.lon, curr.lat, curr.lon);
    distanceKm += segDistKm;

    if (prev.ele !== null && curr.ele !== null) {
      const diff = curr.ele - prev.ele;
      // Threshold of 2m to ignore GPS noise
      if (diff > 2) elevGain += diff;
      else if (diff < -2) elevLoss += Math.abs(diff);

      if (segDistKm > 0.001) {
        // avoid division by near-zero
        const slopePct = Math.abs((diff / (segDistKm * 1000)) * 100);
        if (slopePct < 150 && slopePct > maxSlope) maxSlope = slopePct; // cap at 150% to ignore outliers
      }
    }
  }

  const elevMax = eles.length ? Math.max(...eles) : null;
  const elevMin = eles.length ? Math.min(...eles) : null;
  const avgElev = eles.length ? eles.reduce((a, b) => a + b, 0) / eles.length : null;

  const start = points[0];
  const end = points[points.length - 1];
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);

  const startEndDist = haversineKm(start.lat, start.lon, end.lat, end.lon);
  const isCircular = startEndDist < 0.5;

  // Naismith's rule: walking pace 4 km/h + 10 min per 100m elevation gain
  const estimatedDurationMin = Math.round((distanceKm / 4) * 60 + elevGain / 10);

  // Composite difficulty score (0–100), weighted by distance, elevation gain, and max slope
  // Each component is normalized to its typical maximum for reference:
  //   distance: 40km = 40 pts, elevation: 2000m = 40 pts, slope: 50% = 20 pts
  const distScore = Math.min(1, distanceKm / 40) * 40;
  const gainScore = Math.min(1, elevGain / 2000) * 40;
  const slopeScore = Math.min(1, maxSlope / 50) * 20;
  const difficultyScore = Math.round((distScore + gainScore + slopeScore) * 10) / 10;

  let effortLevel;
  if (difficultyScore < 25) effortLevel = 'easy';
  else if (difficultyScore < 50) effortLevel = 'moderate';
  else if (difficultyScore < 75) effortLevel = 'hard';
  else effortLevel = 'very_hard';

  const childFriendly = distanceKm <= 8 && elevGain <= 300 && maxSlope <= 20;
  const petFriendly = distanceKm <= 15 && elevGain <= 600;
  const trailCode = extractTrailCode(name);

  // Build cumulative distances for the smoothed points array
  const cumulativeDists = [0];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    cumulativeDists.push(
      cumulativeDists[i - 1] + haversineKm(prev.lat, prev.lon, curr.lat, curr.lon),
    );
  }

  // Sample up to 300 evenly-spaced points for the track profile
  const trackProfile = sampleTrackPoints(points, cumulativeDists, 300);

  return {
    name,
    description,
    source,
    trail_code: trailCode,
    route_type: routeTypeFromCode(trailCode),
    distance_km: Math.round(distanceKm * 100) / 100,
    elevation_max_m: elevMax !== null ? Math.round(elevMax * 10) / 10 : null,
    elevation_min_m: elevMin !== null ? Math.round(elevMin * 10) / 10 : null,
    elevation_gain_m: Math.round(elevGain),
    elevation_loss_m: Math.round(elevLoss),
    avg_elevation_m: avgElev !== null ? Math.round(avgElev) : null,
    max_slope_pct: Math.round(maxSlope * 10) / 10,
    is_circular: isCircular,
    start_lat: Math.round(start.lat * 1e7) / 1e7,
    start_lng: Math.round(start.lon * 1e7) / 1e7,
    end_lat: Math.round(end.lat * 1e7) / 1e7,
    end_lng: Math.round(end.lon * 1e7) / 1e7,
    bbox_min_lat: Math.round(Math.min(...lats) * 1e7) / 1e7,
    bbox_max_lat: Math.round(Math.max(...lats) * 1e7) / 1e7,
    bbox_min_lng: Math.round(Math.min(...lons) * 1e7) / 1e7,
    bbox_max_lng: Math.round(Math.max(...lons) * 1e7) / 1e7,
    estimated_duration_min: estimatedDurationMin,
    difficulty_score: difficultyScore,
    effort_level: effortLevel,
    child_friendly: childFriendly,
    pet_friendly: petFriendly,
    season_best: bestSeason(avgElev, elevMax),
    point_count: pointCount,
    waypoint_count: waypointCount,
    track_profile: trackProfile,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n🥾 Trail GPX Import`);
  console.log(`   Country : ${COUNTRY}`);
  console.log(`   Dir     : ${DIR}`);
  console.log(`   Dry run : ${DRY_RUN}`);
  console.log(`   Limit   : ${LIMIT ?? 'all'}\n`);

  let allFiles;
  try {
    allFiles = await readdir(DIR);
  } catch {
    console.error(`Error: cannot read directory "${DIR}"`);
    process.exit(1);
  }

  const gpxFiles = allFiles.filter((f) => f.toLowerCase().endsWith('.gpx'));
  const files = LIMIT ? gpxFiles.slice(0, LIMIT) : gpxFiles;
  console.log(`Found ${files.length} GPX files to process (${gpxFiles.length} total in dir)\n`);

  let success = 0;
  let errors = 0;
  let skipped = 0;
  const batch = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const id = extractId(filename);

    if (!id) {
      console.warn(`  ⚠  Skipped (no ID in filename): ${filename}`);
      skipped++;
      continue;
    }

    try {
      const gpxContent = await readFile(join(DIR, filename), 'utf-8');
      const metrics = analyzeGPX(gpxContent, filename);

      if (!metrics) {
        console.warn(`  ⚠  Skipped (< 2 track points): ${filename}`);
        skipped++;
        continue;
      }

      const slug = `${slugify(metrics.name)}-${id}`;

      // Slope breakdown (no API, derived from track_profile)
      const slopeBreakdown = computeSlopeBreakdown(metrics.track_profile);

      // Nominatim reverse geocoding — skipped in dry-run
      let geoData = { region: null, place: null };
      if (!DRY_RUN) {
        geoData = await fetchNominatimGeocode(metrics.start_lat, metrics.start_lng);
        await sleep(1100); // Nominatim rate limit: 1 req/s
      }

      // OSM enrichment (Overpass API) — skipped in dry-run
      let osmData = null;
      if (!DRY_RUN && metrics.track_profile && metrics.bbox_min_lat !== null) {
        const bboxStr = `${metrics.bbox_min_lat},${metrics.bbox_min_lng},${metrics.bbox_max_lat},${metrics.bbox_max_lng}`;
        osmData = await fetchOsmEnrichment(bboxStr, metrics.track_profile);
        await sleep(1100); // Overpass rate limit: ~1 req/s
      }

      const row = {
        id,
        slug,
        country: COUNTRY,
        gpx_file: filename,
        region: geoData.region,
        place: geoData.place,
        ...metrics,
        slope_breakdown: slopeBreakdown,
        dominant_surface: osmData?.dominant_surface ?? null,
        surface_breakdown: osmData?.surface_breakdown ?? null,
        dominant_path_type: osmData?.dominant_path_type ?? null,
        path_type_breakdown: osmData?.path_type_breakdown ?? null,
        escape_points: osmData?.escape_points ?? null,
        water_sources: osmData?.water_sources ?? null,
      };

      if (DRY_RUN) {
        if (i < 5) {
          console.log(`\n--- ${filename}`);
          console.log(JSON.stringify(row, null, 2));
        }
        success++;
      } else {
        batch.push(row);

        // Flush batch when full or on last file
        if (batch.length >= BATCH_SIZE || i === files.length - 1) {
          const { error } = await supabase.from('trails').upsert(batch, { onConflict: 'id' });
          if (error) {
            console.error(`  ✗  Batch upsert error: ${error.message}`);
            if (error.cause) console.error(`      Cause: ${error.cause}`);
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

    if ((i + 1) % 100 === 0) {
      console.log(`  ⏳ Processed ${i + 1}/${files.length}...`);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Success : ${success}`);
  console.log(`   Errors  : ${errors}`);
  console.log(`   Skipped : ${skipped}`);

  if (DRY_RUN) {
    console.log(`\nRun without --dry-run to write to Supabase.`);
  }
}

main();
