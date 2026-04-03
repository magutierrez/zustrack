/**
 * Shared helpers for zustrack import scripts.
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/** Haversine distance in km */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Sleep for ms milliseconds */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

/** Create a Supabase service-role client from environment variables. */
export function createSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

/**
 * Parse common CLI flags and return a config object.
 *
 * Supported flags:
 *   --country es    (default: 'es')
 *   --dir ./path    (default: './gpx_trails')
 *   --limit N
 *   --dry-run
 *   --force
 *   --skip-existing
 */
export function parseCLIArgs() {
  const args = process.argv.slice(2);
  const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
  const hasFlag = (flag) => args.includes(flag);

  return {
    country:      getArg('--country') ?? 'es',
    dir:          getArg('--dir')     ?? './gpx_trails',
    limit:        getArg('--limit')   ? parseInt(getArg('--limit'), 10) : null,
    dryRun:       hasFlag('--dry-run'),
    force:        hasFlag('--force'),
    skipExisting: hasFlag('--skip-existing'),
  };
}
