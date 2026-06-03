-- Idempotent migration - skip if tables exist
-- For pushing to existing DB

-- Check if tables exist before creating
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
    CREATE TABLE users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('admin', 'employer', 'applicant')),
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'verified', 'suspended')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- Add other tables similarly if needed
-- Enable RLS on existing tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_posts ENABLE ROW LEVEL SECURITY;
-- Add more as needed

-- Ensure RLS policies for job_posts (from 005)
DROP POLICY IF EXISTS "job_posts_employer" ON job_posts;
CREATE POLICY "job_posts_employer" ON job_posts FOR ALL USING (
  employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()::text)
) WITH CHECK (
  employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()::text)
);

CREATE POLICY "job_posts_public_read" ON job_posts FOR SELECT USING (true);
CREATE POLICY "job_posts_admin" ON job_posts FOR ALL USING (auth.role() = 'service_role');
