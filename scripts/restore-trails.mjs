#!/usr/bin/env node
/**
 * Restore Trails from Backup
 */
import { readFile } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BACKUP_PATH = 'backups/2026-04-05_16-19-48/trails.json';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function main() {
  console.log('Restoring trails from backup...');
  const data = JSON.parse(await readFile(BACKUP_PATH, 'utf8'));
  
  // Upsert in batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('trails').upsert(batch);
    if (error) console.error('Error restoring batch:', error.message);
    else console.log(`Restored ${i + batch.length}/${data.length}...`);
  }
  console.log('Done!');
}
main();
