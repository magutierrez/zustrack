#!/usr/bin/env node
/**
 * Detect and Delete Straight Lines Script
 *
 * Detects trails with unnatural straight lines (long distances between consecutive
 * GPS points without any intermediate points, usually due to lost signal or
 * paused recording). Deletes the corrupted trails to maintain data quality.
 *
 * Usage:
 *   node scripts/fix-straight-lines.mjs [--dry-run] [--country it] [--threshold 1.5]
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
const COUNTRY = getArg('--country');
const LIMIT = getArg('--limit') ? parseInt(getArg('--limit'), 10) : null;
const THRESHOLD = getArg('--threshold') ? parseFloat(getArg('--threshold')) : 1.5;
const PAGE_SIZE = 1000;

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
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n📏 Fix Straight Lines Script`);
  console.log(`   Country   : ${COUNTRY ?? 'all'}`);
  console.log(`   Threshold : > ${THRESHOLD} km gap between points`);
  console.log(`   Dry run   : ${DRY_RUN}`);
  console.log(`   Limit     : ${LIMIT ?? 'all matching'}\n`);

  let trails = [];
  let from = 0;

  console.log('Fetching trails from database...');
  while (true) {
    let query = supabase
      .from('trails')
      .select('id, slug, country, track_profile, distance_km')
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
    console.log('✅ No trails found to analyze!');
    return;
  }

  console.log(`Analyzing ${trails.length} trail(s)...\n`);

  const col = (s, w) => String(s ?? '').padEnd(w).slice(0, w);
  console.log(
    col('ID', 10) +
    col('Country', 10) +
    col('slug', 60) +
    col('Total dist', 15) +
    'Max straight line',
  );
  console.log('─'.repeat(120));

  const corruptedTrails = [];

  for (const trail of trails) {
    const profile = trail.track_profile;
    if (!profile || profile.length < 2) continue;

    let maxSegmentDist = 0;

    for (let i = 1; i < profile.length; i++) {
      const prev = profile[i - 1];
      const curr = profile[i];
      const dist = curr.d - prev.d;
      
      if (dist > maxSegmentDist) {
        maxSegmentDist = dist;
      }
    }

    if (maxSegmentDist > THRESHOLD) {
      console.log(
        col(trail.id, 10) +
        col(trail.country.toUpperCase(), 10) +
        col(trail.slug, 60) +
        col(`${trail.distance_km.toFixed(1)} km`, 15) +
        col(`${maxSegmentDist.toFixed(2)} km`, 15)
      );
      corruptedTrails.push(trail.id);
    }
  }

  console.log('\n' + '═'.repeat(120));
  
  if (corruptedTrails.length === 0) {
    console.log(`\n✅ Done! No trails found with straight-line gaps > ${THRESHOLD} km.`);
    return;
  }

  console.log(`\n⚠️  Found ${corruptedTrails.length} corrupted trail(s) with straight lines > ${THRESHOLD} km.`);

  if (DRY_RUN) {
    console.log(`\n[dry-run] Total would be deleted: ${corruptedTrails.length}`);
    console.log('Run without --dry-run to perform the actual deletion.');
    return;
  }

  console.log('\nDeleting corrupted trails...');

  // Delete in batches to avoid URL size limits if there are many IDs
  const BATCH_SIZE = 100;
  let deletedCount = 0;

  for (let i = 0; i < corruptedTrails.length; i += BATCH_SIZE) {
    const batch = corruptedTrails.slice(i, i + BATCH_SIZE);
    const { error: deleteError } = await supabase
      .from('trails')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error('✗ Error deleting trails batch:', deleteError.message);
      process.exit(1);
    }
    deletedCount += batch.length;
  }

  console.log(`\n✅ Successfully deleted ${deletedCount} corrupted trail(s).`);
}

main();
