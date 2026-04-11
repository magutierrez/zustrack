#!/usr/bin/env node
/**
 * Fix Italy Trail Codes Script
 *
 * Scans Supabase for Italian trails with 'unknown' route_type or missing trail_code.
 * Re-evaluates their names to extract CAI or PR codes.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const DRY_RUN = hasFlag('--dry-run');
const PAGE_SIZE = 1000;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}
const supabase = createClient(url, key);

function extractItalyTrailCode(name) {
  // Catch "CAI 105", "Sentiero CAI 105", "PR 505", "CAI-105"
  const match = name.match(/\b(CAI|PR)[\s-]*([A-Z]{0,3}[\s-]*\d+(?:\.\d+)*[a-zA-Z]?)\b/i);
  if (match) {
    const prefix = match[1].toUpperCase();
    let number = match[2].toUpperCase().replace(/\s+/g, '-');
    return `${prefix}-${number}`;
  }
  return null;
}

function getRouteType(trailCode) {
  if (!trailCode) return 'unknown';
  if (trailCode.startsWith('CAI')) return 'CAI';
  if (trailCode.startsWith('PR')) return 'PR';
  return 'unknown';
}

async function main() {
  console.log(`\n🇮🇹 Fix Italy Trail Codes Script`);
  console.log(`   Dry run : ${DRY_RUN}\n`);

  let trails = [];
  let from = 0;

  console.log('Fetching trails from database...');
  while (true) {
    const { data, error } = await supabase
      .from('trails')
      .select('id, name, slug, trail_code, route_type')
      .eq('country', 'it')
      .range(from, from + PAGE_SIZE - 1);

    if (error) { console.error('Fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;

    trails = trails.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`Analyzing ${trails.length} Italian trail(s)...\n`);

  const updates = [];
  let unknownCount = 0;

  for (const trail of trails) {
    const originalType = trail.route_type;
    const originalCode = trail.trail_code;
    
    // We want to fix if type is unknown, or code is missing, or we can find a better code
    const newCode = extractItalyTrailCode(trail.name) || extractItalyTrailCode(trail.slug.replace(/-/g, ' '));
    const newType = getRouteType(newCode);

    if (newCode && newType !== 'unknown' && (originalType !== newType || originalCode !== newCode)) {
      console.log(`[FIX] ${trail.name}`);
      console.log(`   Old: ${originalCode} / ${originalType}`);
      console.log(`   New: ${newCode} / ${newType}\n`);
      
      updates.push({
        id: trail.id,
        trail_code: newCode,
        route_type: newType
      });
    } else if (newType === 'unknown' && originalType === 'unknown') {
      unknownCount++;
    }
  }

  console.log(`\nFound ${updates.length} trails to fix.`);
  console.log(`Still unknown: ${unknownCount} trails.`);

  if (DRY_RUN) {
    console.log('\n[dry-run] Run without --dry-run to update the database.');
    return;
  }

  if (updates.length > 0) {
    console.log('\nUpdating database...');
    const BATCH_SIZE = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(update => 
        supabase.from('trails').update({
          trail_code: update.trail_code,
          route_type: update.route_type
        }).eq('id', update.id)
      );

      const results = await Promise.all(promises);
      
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error(`✗ Error updating batch ${i}:`, errors[0].error.message);
        errorCount += errors.length;
        successCount += (batch.length - errors.length);
      } else {
        successCount += batch.length;
      }
    }
    console.log(`\n✅ Done! Fixed: ${successCount}, Errors: ${errorCount}`);
  } else {
    console.log('\n✅ No trails needed fixing.');
  }
}

main().catch(console.error);
