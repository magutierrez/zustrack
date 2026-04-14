#!/usr/bin/env node
/**
 * Fix Zero Elevation Script
 *
 * Detects trails where both elevation_gain_m and elevation_loss_m are exactly 0
 * despite having valid elevation data stored in track_profile. This happens when:
 *   - The source GPX lacked <ele> tags (step1 stored 0 correctly)
 *   - A later fix script (fix-elevation-es.mjs / fix-elevation-it.mjs) updated
 *     the `e` values in track_profile but did not recalculate the derived metrics
 *
 * Detection criteria (both must be true):
 *   - elevation_gain_m = 0 AND elevation_loss_m = 0
 *   - track_profile is not null and contains at least one non-null `e` value
 *
 * Recalculates gain/loss/min/max/avg from the sampled track_profile using no
 * 2 m threshold (appropriate for raw GPX but not for the coarsely-sampled profile).
 * Skips trails whose profile has no valid elevation or whose recalculated gain
 * is still 0 (genuinely flat terrain).
 *
 * Fields updated:
 *   elevation_gain_m, elevation_loss_m, elevation_min_m, elevation_max_m,
 *   avg_elevation_m, max_slope_pct, estimated_duration_min, difficulty_score,
 *   effort_level, child_friendly, pet_friendly
 *
 * Usage:
 *   node scripts/fix-zero-elevation.mjs [--dry-run] [--limit N] [--country es]
 *
 * Required env vars (from .env.local):
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

const DRY_RUN  = hasFlag('--dry-run');
const LIMIT    = getArg('--limit') ? parseInt(getArg('--limit'), 10) : null;
const COUNTRY  = getArg('--country');
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
// Elevation helpers (same as fix-bad-elevation.mjs)
// ---------------------------------------------------------------------------

/** Recalculate gain, loss, min, max, avg from a track_profile — no threshold */
function calcElevationStats(profile) {
  const valid = profile.map((p) => p.e).filter((e) => e !== null && !isNaN(e));
  if (valid.length < 2) return null;

  let gain = 0;
  let loss = 0;
  let prevE = null;

  for (const p of profile) {
    const e = p.e;
    if (e === null || isNaN(e)) continue;
    if (prevE !== null) {
      const diff = e - prevE;
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }
    prevE = e;
  }

  return {
    gain: Math.round(gain * 10) / 10,
    loss: Math.round(loss * 10) / 10,
    min:  Math.round(Math.min(...valid) * 10) / 10,
    max:  Math.round(Math.max(...valid) * 10) / 10,
    avg:  Math.round((valid.reduce((s, e) => s + e, 0) / valid.length) * 10) / 10,
    validCount: valid.length,
    totalCount: profile.length,
  };
}

// ---------------------------------------------------------------------------
// Slope: 95th percentile over segments ≥20m (same as fix-slopes.mjs)
// ---------------------------------------------------------------------------
function computeMaxSlopeP95(profile) {
  if (!profile || profile.length < 2) return 0;
  const slopes = [];
  for (let i = 1; i < profile.length; i++) {
    const prev = profile[i - 1];
    const curr = profile[i];
    if (prev.e === null || curr.e === null || isNaN(prev.e) || isNaN(curr.e)) continue;
    const distM = (curr.d - prev.d) * 1000;
    if (distM < 20) continue;
    slopes.push(Math.min(Math.abs((curr.e - prev.e) / distM) * 100, 80));
  }
  if (slopes.length === 0) return 0;
  slopes.sort((a, b) => a - b);
  const p95idx = Math.min(Math.floor(slopes.length * 0.95), slopes.length - 1);
  return Math.round((slopes[p95idx] ?? slopes[slopes.length - 1]) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Difficulty / effort (same formula as fix-slopes.mjs and import-trails.mjs)
// ---------------------------------------------------------------------------
function recalcDifficulty(distanceKm, elevationGainM, maxSlopePct) {
  const distScore  = Math.min(1, distanceKm / 40) * 40;
  const gainScore  = Math.min(1, elevationGainM / 2000) * 40;
  const slopeScore = Math.min(1, maxSlopePct / 50) * 20;
  const difficultyScore = Math.round((distScore + gainScore + slopeScore) * 10) / 10;
  const effortLevel =
    difficultyScore < 25 ? 'easy'
    : difficultyScore < 50 ? 'moderate'
    : difficultyScore < 75 ? 'hard'
    : 'very_hard';
  return { difficultyScore, effortLevel };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🔍 Fix Zero Elevation Script');
  console.log(`   Country : ${COUNTRY ?? 'all'}`);
  console.log(`   Dry run : ${DRY_RUN}`);
  console.log(`   Limit   : ${LIMIT ?? 'all matching'}\n`);

  // ── Fetch trails with zero gain and loss (paginated) ───────────────────────
  let trails = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('trails')
      .select('id, slug, distance_km, elevation_gain_m, elevation_loss_m, elevation_min_m, elevation_max_m, avg_elevation_m, max_slope_pct, estimated_duration_min, difficulty_score, effort_level, child_friendly, pet_friendly, track_profile')
      .eq('elevation_gain_m', 0)
      .eq('elevation_loss_m', 0)
      .not('track_profile', 'is', null)
      .order('id')
      .range(from, from + PAGE_SIZE - 1);

    if (COUNTRY) query = query.eq('country', COUNTRY);

    const { data, error } = await query;
    if (error) { console.error('Fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;

    trails = trails.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;

    if (LIMIT && trails.length >= LIMIT) { trails = trails.slice(0, LIMIT); break; }
  }

  if (trails.length === 0) {
    console.log('✅ No trails with zero elevation found!');
    return;
  }

  console.log(`Found ${trails.length} candidate trail(s)\n`);

  // ── Table header ───────────────────────────────────────────────────────────
  const col = (s, w) => String(s ?? '').padEnd(w).slice(0, w);
  console.log(
    col('ID', 12) +
    col('slug', 52) +
    col('valid pts', 10) +
    col('gain after', 12) +
    col('loss after', 12) +
    'effort after',
  );
  console.log('─'.repeat(120));

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const trail of trails) {
    const profile = trail.track_profile;

    const stats = calcElevationStats(profile);

    if (!stats) {
      console.log(
        col(trail.id, 12) + col(trail.slug, 52) +
        col('—', 10) + col('(skipped — no valid elevation in profile)', 40),
      );
      skipped++;
      continue;
    }

    if (stats.gain === 0) {
      console.log(
        col(trail.id, 12) + col(trail.slug, 52) +
        col(`${stats.validCount}/${stats.totalCount}`, 10) +
        col('(skipped — still 0 after recalc, likely flat)', 40),
      );
      skipped++;
      continue;
    }

    const newSlope     = computeMaxSlopeP95(profile);
    const { difficultyScore, effortLevel } = recalcDifficulty(trail.distance_km ?? 0, stats.gain, newSlope);
    const durationMin  = Math.round((trail.distance_km / 4) * 60 + stats.gain / 10);
    const childFriendly = (trail.distance_km ?? 0) <= 8 && stats.gain <= 300 && newSlope <= 20;
    const petFriendly   = (trail.distance_km ?? 0) <= 15 && stats.gain <= 600;

    console.log(
      col(trail.id, 12) +
      col(trail.slug, 52) +
      col(`${stats.validCount}/${stats.totalCount}`, 10) +
      col(`${stats.gain}m`, 12) +
      col(`${stats.loss}m`, 12) +
      effortLevel,
    );

    if (DRY_RUN) { fixed++; continue; }

    const { error } = await supabase
      .from('trails')
      .update({
        elevation_gain_m:       stats.gain,
        elevation_loss_m:       stats.loss,
        elevation_min_m:        stats.min,
        elevation_max_m:        stats.max,
        avg_elevation_m:        stats.avg,
        max_slope_pct:          newSlope,
        estimated_duration_min: durationMin,
        difficulty_score:       difficultyScore,
        effort_level:           effortLevel,
        child_friendly:         childFriendly,
        pet_friendly:           petFriendly,
      })
      .eq('id', trail.id);

    if (error) {
      console.error(`  ✗  Update error id=${trail.id}: ${error.message}`);
      errors++;
    } else {
      fixed++;
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(120));
  console.log('\n✅ Done!');
  console.log(`   Fixed   : ${fixed}`);
  console.log(`   Skipped : ${skipped} (no valid elevation or genuinely flat)`);
  console.log(`   Errors  : ${errors}`);
  if (DRY_RUN) console.log('\n   Run without --dry-run to write to Supabase.');
}

main();
