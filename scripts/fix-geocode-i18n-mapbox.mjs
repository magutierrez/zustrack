#!/usr/bin/env node
/**
 * fix-geocode-i18n-mapbox — Populate `region_i18n` JSONB using Mapbox Geocoding API
 *
 * Same goal as fix-geocode-i18n.mjs but uses Mapbox instead of Nominatim:
 *   - No 1 req/s rate limit → all 6 locales fetched in parallel per region
 *   - Typical runtime: <1 minute for 100 unique regions
 *
 * Prerequisites:
 *   ALTER TABLE trails ADD COLUMN IF NOT EXISTS region_i18n JSONB DEFAULT NULL;
 *
 * Usage:
 *   node scripts/fix-geocode-i18n-mapbox.mjs [--dry-run] [--country es]
 *
 * Flags:
 *   --dry-run    Print i18n maps without writing to Supabase
 *   --country X  Process only trails from this country (omit for all)
 *
 * Required env vars (from .env.local):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MAPBOX_ACCESS_TOKEN
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createSupabase, parseCLIArgs } from './lib.mjs';

const { country, dryRun, limit } = parseCLIArgs();
const LOCALES = ['en', 'es', 'ca', 'fr', 'it', 'de'];

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
if (!MAPBOX_TOKEN) {
  console.error('Error: MAPBOX_ACCESS_TOKEN env var is required.');
  console.error('Add it to .env.local: MAPBOX_ACCESS_TOKEN=pk.xxx');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Mapbox Geocoding
// ---------------------------------------------------------------------------

/**
 * Reverse-geocode a coordinate with Mapbox and return the region name in the
 * requested language. Uses types=region to target administrative regions
 * (states / provinces / Länder). Falls back to reading the `region` entry
 * from the context array of a broader reverse geocode if the typed query
 * returns no results.
 */
async function fetchRegionMapbox(lat, lng, locale) {
  try {
    // Primary: request region type directly
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
    );
    url.searchParams.set('access_token', MAPBOX_TOKEN);
    url.searchParams.set('language', locale);
    url.searchParams.set('types', 'region');
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    if (feature?.text) return feature.text;

    // Fallback: full reverse geocode, extract region from context
    const fallbackUrl = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
    );
    fallbackUrl.searchParams.set('access_token', MAPBOX_TOKEN);
    fallbackUrl.searchParams.set('language', locale);
    fallbackUrl.searchParams.set('limit', '1');

    const fallbackRes = await fetch(fallbackUrl.toString(), {
      signal: AbortSignal.timeout(10000),
    });
    if (!fallbackRes.ok) return null;

    const fallbackData = await fallbackRes.json();
    const context = fallbackData.features?.[0]?.context ?? [];
    const regionCtx = context.find((c) => c.id?.startsWith('region.'));
    return regionCtx?.text ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch all 6 locales in parallel for a single coordinate.
 */
async function buildRegionI18n(lat, lng) {
  const results = await Promise.all(
    LOCALES.map((locale) => fetchRegionMapbox(lat, lng, locale)),
  );
  const i18n = {};
  for (let i = 0; i < LOCALES.length; i++) {
    if (results[i]) i18n[LOCALES[i]] = results[i];
  }
  return Object.keys(i18n).length > 0 ? i18n : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🗺️  fix-geocode-i18n-mapbox — Multilingual region names (Mapbox)');
  console.log(`   Country  : ${country ?? 'all'}`);
  console.log(`   Locales  : ${LOCALES.join(', ')}`);
  console.log(`   Limit    : ${limit ?? 'all'}`);
  console.log(`   Dry run  : ${dryRun}\n`);

  const supabase = createSupabase();

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

  // Group by region → one representative coordinate per unique region
  const regionMap = new Map();
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
    process.stdout.write(`  [${idx}/${regionsToProcess.length}] "${regionValue}" ... `);

    try {
      const i18n = await buildRegionI18n(lat, lng);

      if (!i18n) {
        console.log('⚠  no data');
        errors++;
        continue;
      }

      console.log(JSON.stringify(i18n));

      if (dryRun) {
        success++;
        continue;
      }

      let updateQ = writer
        .from('trails')
        .update({ region_i18n: i18n })
        .eq('region', regionValue);

      if (country) updateQ = updateQ.eq('country', country);

      const { error: updateErr } = await updateQ;
      if (updateErr) {
        console.error(`  ✗  Update error: ${updateErr.message}`);
        errors++;
      } else {
        success++;
      }
    } catch (err) {
      console.error(`  ✗  Error for "${regionValue}": ${err.message}`);
      errors++;
    }
  }

  console.log('\n✅ Done!');
  console.log(`   Success : ${success}`);
  console.log(`   Errors  : ${errors}`);
  if (dryRun) console.log('\n   Run without --dry-run to write to Supabase.');
}

main();
