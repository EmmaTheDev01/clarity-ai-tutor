import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

async function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  try {
    const txt = await fs.readFile(envPath, 'utf8');
    const lines = txt.split(/\r?\n/);
    const env = {};
    for (const l of lines) {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
    return env;
  } catch (err) {
    console.error('Could not read .env file:', err.message || err);
    return {};
  }
}

async function main() {
  const env = await loadEnv();
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_KEY;

  if (!url || !key) {
    console.error('Missing Supabase URL or Key in .env. Found keys:', Object.keys(env));
    process.exit(2);
  }

  const supabase = createClient(url, key);

  try {
    console.log('Testing Supabase connection to', url);
    // Try a simple RPC or select to verify connectivity
    const { data: notes, error: notesErr } = await supabase.from('notes').select('id').limit(1);
    if (notesErr) {
      console.error('Error querying notes:', notesErr.message || notesErr);
    } else {
      console.log('Notes reachable, sample rows:', notes.length);
    }

    const { data: mats, error: matsErr } = await supabase.from('materials').select('id').limit(1);
    if (matsErr) {
      console.error('Error querying materials:', matsErr.message || matsErr);
    } else {
      console.log('Materials reachable, sample rows:', mats.length);
    }
  } catch (err) {
    console.error('Supabase test failed:', err.message || err);
    process.exit(3);
  }
}

main();
