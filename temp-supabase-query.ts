import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const getVar = (name: string) => {
  const match = envFile.split(/\r?\n/).find((line) => line.startsWith(`${name}=`));
  if (!match) throw new Error(`${name} not found`);
  return match.replace(new RegExp(`^${name}=`), '').replace(/^"|"$/g, '');
};

const supabaseUrl = getVar('NEXT_PUBLIC_SUPABASE_URL');
const serviceKey = getVar('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = 'johncsantosbrgy634@gmail.com';
  const userRes = await supabase.from('users').select('*').eq('email', email).single();
  console.log('USER RES', userRes.error, JSON.stringify(userRes.data, null, 2));
  const verRes = await supabase.from('verifications').select('*').eq('email', email);
  console.log('VERIFICATIONS', verRes.error, JSON.stringify(verRes.data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
