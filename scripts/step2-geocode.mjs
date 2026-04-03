#!/usr/bin/env node
/**
 * Step 2 — Reverse-geocode trails via Nominatim
 *
 * Fills `region` and `place` for trails that don't have them yet.
 * Respects Nominatim's 1 req/s rate limit with a 1 100 ms sleep between calls.
 *
 * Usage:
 *   node scripts/step2-geocode.mjs --country es [--dry-run] [--limit N] [--force]
 *
 * Flags:
 *   --country   Country code to process (default: es)
 *   --dry-run   Print what would be updated without writing to Supabase
 *   --limit N   Process at most N trails
 *   --force     Re-geocode trails that already have region/place
 *
 * Required env vars (from .env.local):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createSupabase, parseCLIArgs, sleep } from './lib.mjs';

const { country, limit, dryRun, force } = parseCLIArgs();
const PAGE_SIZE = 500;

// ---------------------------------------------------------------------------
// Nominatim
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌍 Step 2 — Geocode (Nominatim)');
  console.log(`   Country  : ${country}`);
  console.log(`   Dry run  : ${dryRun}`);
  console.log(`   Limit    : ${limit ?? 'all'}`);
  console.log(`   Force    : ${force}\n`);

  const supabase = dryRun ? null : createSupabase();

  // Load trails that need geocoding (always use service role client for reads)
  console.log('   Loading trails from Supabase...');
  const reader = createSupabase();
  const trails = [];
  let from = 0;

  while (true) {
    let q = reader
      .from('trails')
      .select('id, start_lat, start_lng')
      .eq('country', country)
      .range(from, from + PAGE_SIZE - 1);

    if (!force) q = q.is('region', null);

    const { data, error } = await q;
    if (error) { console.error('Failed to load trails:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    trails.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const toProcess = limit ? trails.slice(0, limit) : trails;
  console.log(`   Trails to geocode: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log('✅ Nothing to do. Use --force to re-geocode existing trails.');
    return;
  }

  let success = 0, errors = 0;
  const writer = dryRun ? null : createSupabase();

  for (let i = 0; i < toProcess.length; i++) {
    const trail = toProcess[i];
    try {
      const { region, place } = await fetchNominatimGeocode(trail.start_lat, trail.start_lng);

      if (dryRun) {
        console.log(`  [dry-run] id=${trail.id} → region="${region}" place="${place}"`);
        success++;
      } else {
        const { error } = await writer
          .from('trails')
          .update({ region, place })
          .eq('id', trail.id);

        if (error) {
          console.error(`  ✗  id=${trail.id}: ${error.message}`);
          errors++;
        } else {
          success++;
        }
      }
    } catch (err) {
      console.error(`  ✗  id=${trail.id}: ${err.message}`);
      errors++;
    }

    await sleep(1100); // Nominatim rate limit: 1 req/s

    if ((i + 1) % 50 === 0) {
      console.log(`  ⏳ Geocoded ${i + 1}/${toProcess.length}...`);
    }
  }

  console.log('\n✅ Done!');
  console.log(`   Success : ${success}`);
  console.log(`   Errors  : ${errors}`);
  if (dryRun) console.log('\n   Run without --dry-run to write to Supabase.');
  console.log('\n👉 Next: node scripts/step3-osm.mjs --country ' + country);
}

main();
