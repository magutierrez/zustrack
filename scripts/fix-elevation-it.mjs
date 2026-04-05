#!/usr/bin/env node
/**
 * Elevation Fix Script (Italy/Global)
 *
 * Scans gpx_trails/it for GPX files with missing elevation data,
 * fetches them from Open-Meteo Elevation API, recalculates metrics,
 * and updates Supabase.
 *
 * Usage:
 *   node scripts/fix-elevation-it.mjs --dir ./gpx_trails/it --country it [--dry-run] [--limit 5]
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { createClient } from '@supabase/supabase-js';
import gpxParser from 'gpxparser';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const DIR = getArg('--dir') ?? './gpx_trails/it';
const COUNTRY = getArg('--country') ?? 'it';
const DRY_RUN = hasFlag('--dry-run');
const LIMIT = getArg('--limit') ? parseInt(getArg('--limit'), 10) : null;

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractId(filename) {
  const match = filename.match(/_(\d+)\.gpx$/i);
  return match ? parseInt(match[1], 10) : null;
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

function sampleTrackPoints(points, cumulativeDists, maxPoints) {
  if (points.length === 0) return [];
  if (points.length <= maxPoints) {
    return points.map((p, i) => ({
      lat: Math.round(p.lat * 1e6) / 1e6,
      lng: Math.round(p.lon * 1e6) / 1e6,
      d:   Math.round(cumulativeDists[i] * 1000) / 1000,
      e:   p.ele !== null && !isNaN(p.ele) ? Math.round(p.ele) : null,
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
      e:   p.ele !== null && !isNaN(p.ele) ? Math.round(p.ele) : null,
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

function bestSeason(avgElev, maxElev) {
  if (maxElev !== null && maxElev > 2500) return 'avoid_winter';
  if (avgElev !== null && avgElev > 2000) return 'avoid_summer';
  return 'year_round';
}

async function fetchOpenMeteoElevation(points) {
  const batchSize = 100;
  const results = [];

  for (let i = 0; i < points.length; i += batchSize) {
    const slice = points.slice(i, i + batchSize);
    const lats = slice.map((p) => p.lat).join(',');
    const lons = slice.map((p) => p.lon).join(',');

    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`;

    let retryCount = 0;
    const maxRetries = 5;
    let success = false;

    while (!success && retryCount < maxRetries) {
      try {
        const res = await fetch(url);

        if (res.status === 429) {
          const waitTime = Math.pow(2, retryCount) * 2000;
          console.warn(`   ⚠️  Rate limited (429). Retrying in ${waitTime / 1000}s...`);
          await sleep(waitTime);
          retryCount++;
          continue;
        }

        if (!res.ok) throw new Error(`Open-Meteo Elevation API error: ${res.statusText}`);

        const data = await res.json();
        data.elevation.forEach((ele, idx) => {
          results.push({ ...slice[idx], ele });
        });
        success = true;
      } catch (err) {
        if (retryCount === maxRetries - 1) throw err;
        retryCount++;
        await sleep(1000);
      }
    }

    if (i + batchSize < points.length) await sleep(1000); // Wait 1s between successful batches
  }

  return results;
}

function calcMetrics(rawPoints) {
  // Smooth elevation
  const rawEles = rawPoints.map(p => p.ele ?? null);
  const smoothedEles = smoothElevation(rawEles, 5);
  const points = rawPoints.map((p, i) => ({ ...p, ele: smoothedEles[i] }));

  let distanceKm = 0, elevGain = 0, elevLoss = 0, maxSlope = 0;
  const eles = points.map(p => p.ele).filter(e => e !== null && !isNaN(e));

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

  const cumulativeDists = [0];
  for (let i = 1; i < points.length; i++) {
    cumulativeDists.push(
      cumulativeDists[i-1] + haversineKm(points[i-1].lat, points[i-1].lon, points[i].lat, points[i].lon)
    );
  }

  const trackProfile = sampleTrackPoints(points, cumulativeDists, 300);
  const slopeBreakdown = computeSlopeBreakdown(trackProfile);

  return {
    distance_km: Math.round(distanceKm * 100) / 100,
    elevation_gain_m: Math.round(elevGain),
    elevation_loss_m: Math.round(elevLoss),
    elevation_max_m: elevMax !== null ? Math.round(elevMax * 10) / 10 : null,
    elevation_min_m: elevMin !== null ? Math.round(elevMin * 10) / 10 : null,
    avg_elevation_m: avgElev !== null ? Math.round(avgElev) : null,
    max_slope_pct: Math.round(maxSlope * 10) / 10,
    difficulty_score: difficultyScore,
    effort_level: effortLevel,
    estimated_duration_min: estimatedDurationMin,
    child_friendly: distanceKm <= 8 && elevGain <= 300 && maxSlope <= 20,
    pet_friendly: distanceKm <= 15 && elevGain <= 600,
    season_best: bestSeason(avgElev, elevMax),
    slope_breakdown: slopeBreakdown,
    track_profile: trackProfile,
  };
}

async function main() {
  console.log(`\n⛰️  Italy Elevation Fix Script`);
  console.log(`   Dir     : ${DIR}`);
  console.log(`   Limit   : ${LIMIT ?? 'all'}`);
  console.log(`   Dry run : ${DRY_RUN}\n`);

  let allFiles;
  try {
    allFiles = await readdir(DIR);
  } catch {
    console.error(`Error: cannot read directory "${DIR}"`);
    process.exit(1);
  }

  const gpxFiles = allFiles.filter(f => f.toLowerCase().endsWith('.gpx')).slice(0, LIMIT || allFiles.length);
  console.log(`Processing ${gpxFiles.length} GPX files...\n`);

  let corrected = 0, errors = 0;

  for (const filename of gpxFiles) {
    const id = extractId(filename);
    if (!id) continue;

    try {
      const xmlString = await readFile(join(DIR, filename), 'utf-8');
      const gpx = new gpxParser();
      gpx.parse(xmlString);

      // Collect all points from all track segments
      let rawPoints = [];
      if (gpx.tracks && gpx.tracks.length > 0) {
        gpx.tracks.forEach(track => {
          track.points.forEach(p => {
            rawPoints.push({ lat: p.lat, lon: p.lon, ele: p.ele });
          });
        });
      }

      if (rawPoints.length < 2) {
        console.warn(`  ⚠  Skipped (too few points): ${filename}`);
        continue;
      }

      console.log(`[${corrected + 1}] ${filename} (${rawPoints.length} pts)`);

      if (DRY_RUN) {
        console.log(`   [dry-run] Would fetch elevations and update ID ${id}`);
        corrected++;
        continue;
      }

      console.log(`   📥 Fetching elevations from Open-Meteo...`);
      const correctedPoints = await fetchOpenMeteoElevation(rawPoints);
      
      console.log(`   ⛰️  Recalculating metrics...`);
      const metrics = calcMetrics(correctedPoints);

      console.log(`   ✓  Gain: ${metrics.elevation_gain_m}m, Max: ${metrics.elevation_max_m}m, Dist: ${metrics.distance_km}km`);

      const { error } = await supabase
        .from('trails')
        .update(metrics)
        .eq('id', id);

      if (error) {
        console.error(`   ✗  Supabase error: ${error.message}`);
        errors++;
      } else {
        console.log(`   💾 Database updated for ID ${id}`);
        corrected++;
      }
    } catch (err) {
      console.error(`   ✗  Error processing "${filename}": ${err.message}`);
      errors++;
    }
    
    await sleep(500);
  }

  console.log(`\n✅ Done! Corrected: ${corrected}, Errors: ${errors}`);
}

main();
