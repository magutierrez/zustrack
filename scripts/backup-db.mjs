#!/usr/bin/env node
/**
 * Database Backup Script
 *
 * Downloads all rows from every table listed in TABLES and writes them as
 * JSON files into backups/YYYY-MM-DD_HH-MM-SS/.
 *
 * Usage:
 *   node scripts/backup-db.mjs
 *
 * Required env vars (in .env.local or exported before running):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * The backups/ directory is excluded from git via .gitignore.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Tables to back up. Add any future tables here. */
const TABLES = ['trails'];

/** Supabase returns at most 1000 rows per request. */
const PAGE_SIZE = 1000;

// ---------------------------------------------------------------------------
// Supabase client (service role — bypasses RLS)
// ---------------------------------------------------------------------------

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(url, key);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** ISO timestamp formatted as YYYY-MM-DD_HH-MM-SS for use in directory names. */
function timestampDir() {
  return new Date()
    .toISOString()
    .replace('T', '_')
    .replace(/:/g, '-')
    .slice(0, 19);
}

/**
 * Fetch ALL rows from a table using range-based pagination.
 * Supabase's hard limit is 1000 rows per call; we loop until exhausted.
 */
async function fetchAllRows(table) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1)
      .order('id');

    if (error) throw new Error(`Supabase error on table "${table}": ${error.message}`);

    rows.push(...(data ?? []));
    console.log(
      `  ${table}: fetched rows ${from + 1}–${from + (data?.length ?? 0)} (total so far: ${rows.length})`
    );

    if (!data || data.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const ts = timestampDir();
  const outDir = join(process.cwd(), 'backups', ts);

  console.log(`\nDatabase Backup — ${new Date().toISOString()}`);
  console.log(`Output: ${outDir}\n`);

  await mkdir(outDir, { recursive: true });

  const manifest = {
    timestamp: new Date().toISOString(),
    supabase_url: url,
    tables: {},
  };

  for (const table of TABLES) {
    console.log(`Backing up: ${table}`);
    try {
      const rows = await fetchAllRows(table);
      const filePath = join(outDir, `${table}.json`);
      await writeFile(filePath, JSON.stringify(rows, null, 2), 'utf-8');
      manifest.tables[table] = { count: rows.length, file: `${table}.json` };
      console.log(`  => ${rows.length} rows written to ${table}.json\n`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}\n`);
      manifest.tables[table] = { count: 0, error: err.message };
    }
  }

  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Manifest written to manifest.json`);
  console.log(`\nBackup complete: backups/${ts}/`);
}

main();
