import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('❌ No active Supabase session. Login first.');
    return;
  }

  const user = session.user;
  console.log('🌟 Using current user:', user.email, user.id);

  const dbPath = path.join(process.cwd(), 'data', 'portal-db.json');
  const raw = await readFile(dbPath, 'utf8');
  const db = JSON.parse(raw);

  // Check if user already exists
  const existingUser = db.users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());

  if (existingUser) {
    console.log('✅ User already exists:', existingUser.id);
  } else {
    const newUser = {
      id: user.id,
      role: 'employer',
      fullName: user.user_metadata?.full_name || user.email.split('@')[0],
      email: user.email,
      phone: user.user_metadata?.phone || '',
      status: 'verified',
      createdAt: new Date().toISOString(),
    };
    db.users.unshift(newUser);
    console.log('➕ Created user:', newUser.id);
  }

  // Create employer profile
  const userId = user.id;
  let profile = db.employerProfiles.find((p) => p.userId === userId);

  if (!profile) {
    profile = {
      id: `employer-${userId.slice(0,8)}`,
      userId,
      companyName: `${user.user_metadata?.full_name || 'Employer'}'s Business`,
      contactPerson: user.user_metadata?.full_name || user.email.split('@')[0],
      headline: 'Verified local employer',
      location: 'Barangay 634',
      verified: true,
      businessType: 'Local Business',
    };
    db.employerProfiles.unshift(profile);
    console.log('➕ Created profile:', profile.id);
  }

  await writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('✅ Seeded data/portal-db.json with current user employer profile!');
  console.log('🔄 Restart dev server: pnpm dev');
  console.log('🧪 Test: /employer/create-post → Publish → /employer/my-job-posts');
}

seedCurrentUser().catch(console.error);

