import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
);

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Verify connection + check tables
const { error: gamesError } = await sb.from('games').select('id').limit(1);
const { error: playsError } = await sb.from('plays').select('id').limit(1);

const gamesMissing = gamesError?.code === '42P01';
const playsMissing = playsError?.code === '42P01';

if (!gamesMissing && !playsMissing) {
  console.log('✓ Both tables already exist — no migration needed.');
  process.exit(0);
}

if (gamesMissing || playsMissing) {
  console.log('Tables missing:', [gamesMissing && 'games', playsMissing && 'plays'].filter(Boolean).join(', '));
  console.log('\nRun this SQL in the Supabase SQL Editor:');
  console.log('  https://supabase.com/dashboard/project/samzmsbftorwpngbjwgo/sql/new\n');
  const sql = readFileSync(new URL('../supabase/migrations/0001_initial.sql', import.meta.url), 'utf8');
  console.log(sql);
  process.exit(1);
}
