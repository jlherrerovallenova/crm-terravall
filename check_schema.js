import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envVars = {};
fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

supabase.from('properties').select('*').limit(1).then(({ data, error }) => {
  if (error) console.error(error);
  else console.log("Columns:", data.length > 0 ? Object.keys(data[0]) : "No data to infer columns");
});
