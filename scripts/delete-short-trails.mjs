#!/usr/bin/env node
/**
 * Delete Short Trails Script
 *
 * Finds and deletes trails with distance_km < 1.
 *
 * Usage:
 *   node scripts/delete-short-trails.mjs [--dry-run]
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
const hasFlag = (flag) => args.includes(flag);
const DRY_RUN = hasFlag('--dry-run');

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

async function main() {
  console.log(`\n🗑️  Delete Short Trails Script (< 1km)`);
  console.log(`   Dry run : ${DRY_RUN}\n`);

  // 1. Fetch trails to delete
  const { data: trails, error: fetchError } = await supabase
    .from('trails')
    .select('id, slug, distance_km, country')
    .lt('distance_km', 1)
    .order('distance_km');

  if (fetchError) {
    console.error('✗ Error fetching trails:', fetchError.message);
    process.exit(1);
  }

  if (!trails || trails.length === 0) {
    console.log('✅ No trails found with distance < 1km.');
    return;
  }

  console.log(`Found ${trails.length} trail(s) to delete:`);
  trails.forEach(t => {
    console.log(`  - [${t.country.toUpperCase()}] ${t.slug} (${t.distance_km} km)`);
  });

  if (DRY_RUN) {
    console.log(`\n[dry-run] Total would be deleted: ${trails.length}`);
    console.log('Run without --dry-run to perform the actual deletion.');
    return;
  }

  // 2. Perform deletion
  const ids = trails.map(t => t.id);
  const { error: deleteError, count } = await supabase
    .from('trails')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('\n✗ Error deleting trails:', deleteError.message);
    process.exit(1);
  }

  console.log(`\n✅ Successfully deleted ${trails.length} trail(s).`);
}

main();
