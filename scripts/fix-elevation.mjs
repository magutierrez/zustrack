#!/usr/bin/env node
/**
 * Elevation Fix Script
 *
 * Scans gpx_trails/ for GPX files with zero/missing elevation data, corrects
 * them using the IGN WCS LiDAR 5m service (Spain), recalculates all elevation-
 * derived metrics, and patches the affected rows in Supabase.
 *
 * Usage:
 *   node scripts/fix-elevation.mjs [--dir ./gpx_trails] [--limit 3] [--dry-run]
 *
 * Required env vars (in .env.local or exported):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';
import gpxParser from 'gpxparser';
import * as GeoTIFF from 'geotiff';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const DIR = getArg('--dir') ?? './gpx_trails';
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
      d: Math.round(cumulativeDists[i] * 1000) / 1000,
      e: p.ele !== null && !isNaN(p.ele) ? Math.round(p.ele) : null,
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
      e: p.ele !== null && !isNaN(p.ele) ? Math.round(p.ele) : null,
    });
  }
  return result;
}

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
      flat += segDistKm;
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

function bestSeason(avgElev, maxElev) {
  if (maxElev !== null && maxElev > 2500) return 'avoid_winter';
  if (avgElev !== null && avgElev > 2000) return 'avoid_summer';
  return 'year_round';
}

// ---------------------------------------------------------------------------
// Elevation detection & correction (from fix-gpx.mjs)
// ---------------------------------------------------------------------------

function needsElevationCorrection(points) {
  if (!points || points.length === 0) return false;
  let zeroOrMissingCount = 0;
  for (const p of points) {
    const ele = parseFloat(p.ele);
    if (isNaN(ele) || ele === 0) zeroOrMissingCount++;
  }
  return zeroOrMissingCount / points.length > 0.8;
}

function extractBbox(xmlString) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const gpxObj = parser.parse(xmlString);
  const bounds = gpxObj.gpx?.metadata?.bounds;
  if (!bounds) throw new Error('No <bounds> in GPX metadata');
  return {
    minLat: parseFloat(bounds['@_minlat']),
    minLon: parseFloat(bounds['@_minlon']),
    maxLat: parseFloat(bounds['@_maxlat']),
    maxLon: parseFloat(bounds['@_maxlon']),
  };
}

async function correctElevationsIGN(points, bbox) {
  const urlWCS =
    `https://servicios.idee.es/wcs-inspire/mdt?` +
    `SERVICE=WCS&VERSION=1.0.0&REQUEST=GetCoverage&COVERAGE=Elevacion4258_5` +
    `&BBOX=${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}` +
    `&CRS=EPSG:4258&FORMAT=image/tiff&WIDTH=1000&HEIGHT=1000`;

  const response = await fetch(urlWCS, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; zustrackapp/1.0)',
      Accept: 'image/tiff, */*',
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) throw new Error(`IGN WCS error: ${response.statusText}`);

  const arrayBuffer = await response.arrayBuffer();
  const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const rasters = await image.readRasters();
  const elevations = rasters[0];
  const width = image.getWidth();
  const height = image.getHeight();

  return points.map((point) => {
    let pixelX = Math.floor(((point.lon - bbox.minLon) / (bbox.maxLon - bbox.minLon)) * width);
    let pixelY = Math.floor(((bbox.maxLat - point.lat) / (bbox.maxLat - bbox.minLat)) * height);
    pixelX = Math.max(0, Math.min(pixelX, width - 1));
    pixelY = Math.max(0, Math.min(pixelY, height - 1));
    return { ...point, ele: elevations[pixelY * width + pixelX] };
  });
}

// ---------------------------------------------------------------------------
// Recalculate elevation-derived metrics from corrected points
// ---------------------------------------------------------------------------

function calcMetrics(rawPoints) {
  // Smooth elevation
  const rawEles = rawPoints.map((p) => p.ele ?? null);
  const smoothedEles = smoothElevation(rawEles, 5);
  const points = rawPoints.map((p, i) => ({ ...p, ele: smoothedEles[i] }));

  let distanceKm = 0;
  let elevGain = 0;
  let elevLoss = 0;
  let maxSlope = 0;

  const eles = points.map((p) => p.ele).filter((e) => e !== null && !isNaN(e));

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const segDistKm = haversineKm(prev.lat, prev.lon, curr.lat, curr.lon);
    distanceKm += segDistKm;

    if (prev.ele !== null && curr.ele !== null && !isNaN(prev.ele) && !isNaN(curr.ele)) {
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

  // Build cumulative distances
  const cumulativeDists = [0];
  for (let i = 1; i < points.length; i++) {
    cumulativeDists.push(
      cumulativeDists[i - 1] +
        haversineKm(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon),
    );
  }

  const trackProfile = sampleTrackPoints(points, cumulativeDists, 300);
  const slopeBreakdown = computeSlopeBreakdown(trackProfile);

  return {
    elevation_gain_m: Math.round(elevGain),
    elevation_loss_m: Math.round(elevLoss),
    elevation_max_m: elevMax !== null ? Math.round(elevMax * 10) / 10 : null,
    elevation_min_m: elevMin !== null ? Math.round(elevMin * 10) / 10 : null,
    avg_elevation_m: avgElev !== null ? Math.round(avgElev) : null,
    max_slope_pct: Math.round(maxSlope * 10) / 10,
    difficulty_score: difficultyScore,
    effort_level: effortLevel,
    estimated_duration_min: estimatedDurationMin,
    child_friendly: childFriendly,
    pet_friendly: petFriendly,
    season_best: bestSeason(avgElev, elevMax),
    slope_breakdown: slopeBreakdown,
    track_profile: trackProfile,
  };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function fillElevationHoles(points) {
  // A value is considered a hole if it's strictly 0 (IGN outside bounds) or way below sea level
  const isHole = (ele) => ele === undefined || ele === null || ele === 0 || ele < -100;

  let i = 0;
  while (i < points.length) {
    if (isHole(points[i].ele)) {
      let startIndex = i;
      let endIndex = i;

      // Find the end of the current hole
      while (endIndex < points.length && isHole(points[endIndex].ele)) {
        endIndex++;
      }

      // Find valid boundary points
      let prevValid = startIndex > 0 ? points[startIndex - 1] : null;
      let nextValid = endIndex < points.length ? points[endIndex] : null;

      // Edge cases handling
      if (!prevValid && !nextValid) break;
      if (!prevValid) prevValid = nextValid;
      if (!nextValid) nextValid = prevValid;

      // Calculate accumulated distance across the gap for proportional scaling
      let totalGapDistance = 0;
      const gapPoints = [prevValid, ...points.slice(startIndex, endIndex), nextValid];
      const distances = [0];

      for (let j = 1; j < gapPoints.length; j++) {
        const d = calculateDistance(
          gapPoints[j - 1].lat,
          gapPoints[j - 1].lon,
          gapPoints[j].lat,
          gapPoints[j].lon,
        );
        totalGapDistance += d;
        distances.push(totalGapDistance);
      }

      const eleDiff = nextValid.ele - prevValid.ele;

      // Apply linear interpolation based on the distance walked
      for (let j = 0; j < endIndex - startIndex; j++) {
        const pointIndex = startIndex + j;
        const distRatio = totalGapDistance === 0 ? 0 : distances[j + 1] / totalGapDistance;
        points[pointIndex].ele = prevValid.ele + eleDiff * distRatio;
      }

      console.log(
        `   🌉 Interpolated gap of ${endIndex - startIndex} points (crossing border/lost signal).`,
      );
      i = endIndex;
    } else {
      i++;
    }
  }
  return points;
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n🔧 Elevation Fix Script`);
  console.log(`   Dir     : ${DIR}`);
  console.log(`   Limit   : ${LIMIT ?? 'all (needs-correction only)'}`);
  console.log(`   Dry run : ${DRY_RUN}\n`);

  let allFiles;
  try {
    allFiles = await readdir(DIR);
  } catch {
    console.error(`Error: cannot read directory "${DIR}"`);
    process.exit(1);
  }

  const gpxFiles = allFiles.filter((f) => f.toLowerCase().endsWith('.gpx'));
  console.log(`Found ${gpxFiles.length} GPX files total\n`);

  let corrected = 0;
  let skipped = 0;
  let errors = 0;
  const correctedSlugs = [];
  let processed = 0;

  for (const filename of gpxFiles) {
    if (LIMIT && corrected >= LIMIT) break;

    const id = extractId(filename);
    if (!id) {
      skipped++;
      continue;
    }

    let xmlString;
    try {
      xmlString = await readFile(join(DIR, filename), 'utf-8');
    } catch (err) {
      console.error(`  ✗  Cannot read ${filename}: ${err.message}`);
      errors++;
      continue;
    }

    // Parse with gpxparser to get track points
    const gpx = new gpxParser();
    gpx.parse(xmlString);

    if (!gpx.tracks || gpx.tracks.length === 0 || !gpx.tracks[0].points?.length) {
      skipped++;
      continue;
    }

    const rawPoints = gpx.tracks[0].points;

    if (!needsElevationCorrection(rawPoints)) {
      skipped++;
      continue;
    }

    processed++;
    console.log(`[${corrected + 1}${LIMIT ? '/' + LIMIT : ''}] ${filename}`);
    console.log(`   ⚠️  Needs correction (${rawPoints.length} pts, elevation invalid)`);

    // Build name and slug
    const trackName =
      gpx.tracks[0].name ||
      basename(filename, '.gpx')
        .replace(/^Archivo\s+/i, '')
        .replace(/_\d+$/, '')
        .trim();
    const slug = `${slugify(trackName)}-${id}`;

    if (DRY_RUN) {
      console.log(`   [dry-run] Would correct and update slug: ${slug}`);
      corrected++;
      correctedSlugs.push(slug);
      continue;
    }

    try {
      // Get bbox from GPX metadata
      const bbox = extractBbox(xmlString);

      console.log(`   📥 Downloading IGN LiDAR 5m...`);
      const correctedPoints = await correctElevationsIGN(rawPoints, bbox);

      console.log(`   ⛰️  Sampling elevations from raster...`);
      const metrics = calcMetrics(correctedPoints);

      console.log(
        `   ✓  gain: ${metrics.elevation_gain_m}m, max: ${metrics.elevation_max_m}m, effort: ${metrics.effort_level}`,
      );

      // Patch only elevation-derived fields in Supabase
      const { error } = await supabase
        .from('trails')
        .update({
          elevation_gain_m: metrics.elevation_gain_m,
          elevation_loss_m: metrics.elevation_loss_m,
          elevation_max_m: metrics.elevation_max_m,
          elevation_min_m: metrics.elevation_min_m,
          avg_elevation_m: metrics.avg_elevation_m,
          max_slope_pct: metrics.max_slope_pct,
          difficulty_score: metrics.difficulty_score,
          effort_level: metrics.effort_level,
          estimated_duration_min: metrics.estimated_duration_min,
          child_friendly: metrics.child_friendly,
          pet_friendly: metrics.pet_friendly,
          season_best: metrics.season_best,
          slope_breakdown: metrics.slope_breakdown,
          track_profile: metrics.track_profile,
        })
        .eq('id', id);

      if (error) {
        console.error(`   ✗  Supabase update error: ${error.message}`);
        errors++;
      } else {
        console.log(`   💾 Updated slug: ${slug}`);
        corrected++;
        correctedSlugs.push(slug);
      }
    } catch (err) {
      console.error(`   ✗  Error: ${err.message}`);
      errors++;
    }

    // Rate limit: IGN asks for courtesy delay
    await sleep(2500);
  }

  console.log(`\n✅ Done!`);
  console.log(`   Corrected : ${corrected}`);
  console.log(`   Skipped   : ${skipped} (valid elevation or no ID)`);
  console.log(`   Errors    : ${errors}`);

  if (correctedSlugs.length > 0) {
    console.log(`\nCorrected slugs:`);
    for (const s of correctedSlugs) {
      console.log(`  - ${s}`);
    }
  }

  if (DRY_RUN) {
    console.log(`\nRun without --dry-run to update Supabase.`);
  }
}

main();
