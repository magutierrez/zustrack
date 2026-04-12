#!/usr/bin/env node
/**
 * fix-geocode-i18n — Populate `region_i18n` JSONB for all trails
 *
 * Groups trails by distinct `region` value and fetches Nominatim once per locale
 * per unique region (~100 unique regions × 6 locales = ~600 requests, ~11 min).
 *
 * Prerequisites:
 *   ALTER TABLE trails ADD COLUMN IF NOT EXISTS region_i18n JSONB DEFAULT NULL;
 *
 * Usage:
 *   node scripts/fix-geocode-i18n.mjs [--dry-run] [--country es]
 *
 * Flags:
 *   --dry-run    Print i18n maps without writing to Supabase
 *   --country X  Process only trails from this country
 *
 * Required env vars (from .env.local):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createSupabase, parseCLIArgs, sleep } from './lib.mjs';

const { country, dryRun, limit } = parseCLIArgs();
const LOCALES = ['en', 'es', 'ca', 'fr', 'it', 'de'];

// ---------------------------------------------------------------------------
// Nominatim
// ---------------------------------------------------------------------------

async function fetchRegionForLocale(lat, lng, locale) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${locale}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'zustrackapp/1.0 (fix-geocode-i18n)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    return addr.state || addr.region || null;
  } catch {
    return null;
  }
}

async function buildRegionI18n(lat, lng) {
  const i18n = {};
  for (const locale of LOCALES) {
    const name = await fetchRegionForLocale(lat, lng, locale);
    if (name) i18n[locale] = name;
    await sleep(1100); // Nominatim rate limit: 1 req/s
  }
  return Object.keys(i18n).length > 0 ? i18n : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌐 fix-geocode-i18n — Multilingual region names');
  console.log(`   Country  : ${country ?? 'all'}`);
  console.log(`   Locales  : ${LOCALES.join(', ')}`);
  console.log(`   Limit    : ${limit ?? 'all'}`);
  console.log(`   Dry run  : ${dryRun}\n`);

  const supabase = createSupabase();

  // Load one representative point per distinct region
  console.log('   Loading distinct regions from Supabase...');
  let q = supabase
    .from('trails')
    .select('region, start_lat, start_lng')
    .not('region', 'is', null);

  if (country) q = q.eq('country', country);

  const { data: rows, error } = await q;
  if (error) {
    console.error('Failed to load trails:', error.message);
    process.exit(1);
  }

  // Group by region → pick one representative coordinate
  const regionMap = new Map(); // region → {lat, lng}
  for (const row of rows ?? []) {
    if (!regionMap.has(row.region)) {
      regionMap.set(row.region, { lat: row.start_lat, lng: row.start_lng });
    }
  }

  const allRegions = [...regionMap.entries()];
  const regionsToProcess = limit ? allRegions.slice(0, limit) : allRegions;

  console.log(`   Unique regions found: ${regionMap.size} (processing: ${regionsToProcess.length})\n`);

  if (regionsToProcess.length === 0) {
    console.log('✅ Nothing to do. Run step2-geocode first to populate region values.');
    return;
  }

  let success = 0, errors = 0;
  const writer = dryRun ? null : createSupabase();

  let idx = 0;
  for (const [regionValue, { lat, lng }] of regionsToProcess) {
    idx++;
    console.log(`  [${idx}/${regionsToProcess.length}] "${regionValue}" (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

    try {
      const i18n = await buildRegionI18n(lat, lng);

      if (!i18n) {
        console.warn(`    ⚠  No i18n data returned, skipping`);
        errors++;
        continue;
      }

      console.log(`    → ${JSON.stringify(i18n)}`);

      if (dryRun) {
        success++;
        continue;
      }

      // Update all trails with this region value
      let updateQ = writer
        .from('trails')
        .update({ region_i18n: i18n })
        .eq('region', regionValue);

      if (country) updateQ = updateQ.eq('country', country);

      const { error: updateErr } = await updateQ;
      if (updateErr) {
        console.error(`    ✗  Update error: ${updateErr.message}`);
        errors++;
      } else {
        success++;
      }
    } catch (err) {
      console.error(`    ✗  Error for "${regionValue}": ${err.message}`);
      errors++;
    }
  }

  console.log('\n✅ Done!');
  console.log(`   Success : ${success}`);
  console.log(`   Errors  : ${errors}`);
  if (dryRun) console.log('\n   Run without --dry-run to write to Supabase.');
}

main();
