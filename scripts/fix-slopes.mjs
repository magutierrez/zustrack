#!/usr/bin/env node
/**
 * Slope Fix Script
 *
 * Reads track_profile from Supabase, recalculates max_slope_pct using the
 * 95th percentile over segments ≥20m (instead of absolute max with 1m threshold),
 * then patches max_slope_pct, difficulty_score, effort_level and child_friendly.
 *
 * Usage:
 *   node scripts/fix-slopes.mjs [--dry-run] [--limit 10] [--min-slope 40]
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const hasFlag = (flag) => args.includes(flag);

const DRY_RUN = hasFlag('--dry-run');
const LIMIT = getArg('--limit') ? parseInt(getArg('--limit'), 10) : null;
const MIN_SLOPE = getArg('--min-slope') ? parseFloat(getArg('--min-slope')) : 0;
const PAGE_SIZE = 500;

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}
const supabase = createClient(url, key);

// ---------------------------------------------------------------------------
// Improved slope algorithm: 95th percentile over segments ≥20m, cap 80%
// ---------------------------------------------------------------------------

/**
 * Computes a robust max_slope_pct from a track_profile array.
 * - Only considers segments where d spacing ≥ 20m (filters GPS/LiDAR micro-noise)
 * - Caps individual slope at 80% (≈38.7° — extreme but physically possible for GR trails)
 * - Returns the 95th percentile (not the absolute max) to ignore the remaining spikes
 */
function computeMaxSlopeP95(profile) {
  if (!profile || profile.length < 2) return 0;

  const slopes = [];
  for (let i = 1; i < profile.length; i++) {
    const prev = profile[i - 1];
    const curr = profile[i];
    if (prev.e === null || curr.e === null || isNaN(prev.e) || isNaN(curr.e)) continue;
    const distM = (curr.d - prev.d) * 1000; // km → m
    if (distM < 20) continue;
    const slopePct = Math.abs((curr.e - prev.e) / distM) * 100;
    slopes.push(Math.min(slopePct, 80));
  }

  if (slopes.length === 0) return 0;
  slopes.sort((a, b) => a - b);
  const p95idx = Math.min(Math.floor(slopes.length * 0.95), slopes.length - 1);
  return Math.round((slopes[p95idx] ?? slopes[slopes.length - 1]) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Difficulty / effort recalculation (same formula as import-trails.mjs)
// ---------------------------------------------------------------------------

function recalcDifficulty(distanceKm, elevationGainM, maxSlopePct) {
  const distScore = Math.min(1, distanceKm / 40) * 40;
  const gainScore = Math.min(1, elevationGainM / 2000) * 40;
  const slopeScore = Math.min(1, maxSlopePct / 50) * 20;
  const difficultyScore = Math.round((distScore + gainScore + slopeScore) * 10) / 10;

  let effortLevel;
  if (difficultyScore < 25) effortLevel = 'easy';
  else if (difficultyScore < 50) effortLevel = 'moderate';
  else if (difficultyScore < 75) effortLevel = 'hard';
  else effortLevel = 'very_hard';

  return { difficultyScore, effortLevel };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n📐 Fix Slopes Script`);
  console.log(`   Min slope  : ≥${MIN_SLOPE}%`);
  console.log(`   Limit      : ${LIMIT ?? 'all matching'}`);
  console.log(`   Dry run    : ${DRY_RUN}\n`);

  // Fetch all matching trails (paginated), ordered by max_slope_pct DESC
  let trails = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('trails')
      .select('id, slug, max_slope_pct, distance_km, elevation_gain_m, track_profile')
      .not('track_profile', 'is', null)
      .order('max_slope_pct', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (MIN_SLOPE > 0) query = query.gte('max_slope_pct', MIN_SLOPE);

    const { data, error } = await query;
    if (error) { console.error('Supabase fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;

    trails = trails.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;

    if (LIMIT && trails.length >= LIMIT) {
      trails = trails.slice(0, LIMIT);
      break;
    }
  }

  console.log(`Fetched ${trails.length} trails to process (min_slope≥${MIN_SLOPE}%)\n`);

  // Header
  const col = (s, w) => String(s).padEnd(w).slice(0, w);
  console.log(
    col('ID', 10) + col('slug', 46) + col('before', 9) + col('after', 9) + col('effort change', 28),
  );
  console.log('-'.repeat(102));

  let updated = 0;
  let unchanged = 0;
  let errors = 0;
  const BATCH_SIZE = 50;
  const batchUpdates = [];

  for (const trail of trails) {
    const newSlope = computeMaxSlopeP95(trail.track_profile);
    const { difficultyScore, effortLevel } = recalcDifficulty(
      trail.distance_km ?? 0,
      trail.elevation_gain_m ?? 0,
      newSlope,
    );
    const childFriendly =
      (trail.distance_km ?? 0) <= 8 && (trail.elevation_gain_m ?? 0) <= 300 && newSlope <= 20;

    const oldSlope = trail.max_slope_pct ?? 0;
    const slopeChanged = Math.abs(oldSlope - newSlope) > 0.5;

    const effortBefore = (() => {
      const { effortLevel: e } = recalcDifficulty(
        trail.distance_km ?? 0,
        trail.elevation_gain_m ?? 0,
        oldSlope,
      );
      return e;
    })();

    const effortNote = effortBefore !== effortLevel ? `${effortBefore} → ${effortLevel}` : effortLevel;

    console.log(
      col(trail.id, 10) +
      col(trail.slug ?? '', 46) +
      col(oldSlope.toFixed(1) + '%', 9) +
      col(newSlope.toFixed(1) + '%', 9) +
      effortNote,
    );

    if (!slopeChanged) {
      unchanged++;
      continue;
    }

    if (DRY_RUN) {
      updated++;
      continue;
    }

    batchUpdates.push({ id: trail.id, newSlope, difficultyScore, effortLevel, childFriendly });

    if (batchUpdates.length >= BATCH_SIZE) {
      const err = await flushBatch(batchUpdates);
      errors += err;
      updated += batchUpdates.length - err;
      batchUpdates.length = 0;
    }
  }

  // Flush remaining
  if (!DRY_RUN && batchUpdates.length > 0) {
    const err = await flushBatch(batchUpdates);
    errors += err;
    updated += batchUpdates.length - err;
  } else if (DRY_RUN) {
    // updated already counted above
  }

  console.log('\n' + '='.repeat(102));
  console.log(`\n✅ Done!`);
  console.log(`   Updated   : ${updated}`);
  console.log(`   Unchanged : ${unchanged} (slope diff < 0.5%)`);
  console.log(`   Errors    : ${errors}`);

  if (DRY_RUN) {
    console.log(`\nRun without --dry-run to write to Supabase.`);
  }
}

async function flushBatch(updates) {
  let errors = 0;
  // Supabase JS v2 doesn't support bulk update with different values per row —
  // use individual updates but fire them concurrently in the batch
  await Promise.all(
    updates.map(async ({ id, newSlope, difficultyScore, effortLevel, childFriendly }) => {
      const { error } = await supabase
        .from('trails')
        .update({
          max_slope_pct: newSlope,
          difficulty_score: difficultyScore,
          effort_level: effortLevel,
          child_friendly: childFriendly,
        })
        .eq('id', id);
      if (error) {
        console.error(`  ✗  Update error id=${id}: ${error.message}`);
        errors++;
      }
    }),
  );
  return errors;
}

main();
