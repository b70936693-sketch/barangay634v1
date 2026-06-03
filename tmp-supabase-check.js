const { readFileSync } = require('node:fs');
const { createClient } = require('@supabase/supabase-js');

function parseEnv(path) {
  const raw = readFileSync(path, 'utf8');
  const env = {};
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }
  });
  return env;
}

const env = parseEnv('.env.local');
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('env loaded', { url: !!url, anon: !!anon, service: !!service });
if (!url || !anon) {
  throw new Error('Missing Supabase env variables');
}

const supabase = createClient(url, service || anon);

(async () => {
  try {
    const { data, error, status } = await supabase.auth.admin.listUsers();
    console.log('auth list status', status, 'error', error && error.message);
    console.log('users count', Array.isArray(data?.users) ? data.users.length : data?.users);
    if (Array.isArray(data?.users)) {
      console.log(data.users.slice(0, 5).map((u) => ({ id: u.id, email: u.email, confirmed: !!u.confirmed_at, created: u.created_at })));
    }
  } catch (err) {
    console.error('failed auth list', err);
  }

  try {
    const { data: usersData, error: usersError } = await supabase.from('users').select('*').limit(5);
    console.log('users table err', usersError && usersError.message, 'rows', usersData?.length);
    console.log(usersData);
  } catch (err) {
    console.error('failed users table', err);
  }

  try {
    const { data: jobPostsData, error: jobPostsError } = await supabase.from('job_posts').select('*').limit(5);
    console.log('job_posts table err', jobPostsError && jobPostsError.message, 'rows', jobPostsData?.length);
    console.log(jobPostsData);
  } catch (err) {
    console.error('failed job_posts table', err);
  }
})();
