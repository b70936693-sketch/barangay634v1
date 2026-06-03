-- Fix RLS policy for job_posts - match employer_profiles.user_id = auth.uid()
-- Previous policy had wrong field type matching

-- Drop broken policy
DROP POLICY IF EXISTS "job_posts_employer" ON job_posts;

-- Corrected policy: employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
CREATE POLICY "job_posts_employer" ON job_posts
  FOR ALL
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()::text))
  WITH CHECK (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()::text));

-- Ensure public read access
CREATE POLICY "job_posts_public_read" ON job_posts
  FOR SELECT
  USING (true);

-- Admin full access
DROP POLICY IF EXISTS "job_posts_admin" ON job_posts;
CREATE POLICY "job_posts_admin" ON job_posts
  FOR ALL
  USING (auth.role() = 'service_role');
