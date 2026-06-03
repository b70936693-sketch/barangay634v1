-- RLS Policies for Barangay634 Portal
-- Users can only access own data. Admin full access.

-- Users table policies
CREATE POLICY users_select ON users FOR SELECT USING (true);
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid() = id);

-- Employer profiles (employer owns)
CREATE POLICY employer_profiles_select ON employer_profiles FOR SELECT USING (true);
CREATE POLICY employer_profiles_employer_own ON employer_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY employer_profiles_admin ON employer_profiles FOR ALL USING (auth.role() = 'service_role');

-- Applicant profiles (applicant owns)
CREATE POLICY applicant_profiles_select ON applicant_profiles FOR SELECT USING (true);
CREATE POLICY applicant_profiles_applicant_own ON applicant_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY applicant_profiles_admin ON applicant_profiles FOR ALL USING (auth.role() = 'service_role');

-- Job posts (public read, employer own writes)
CREATE POLICY job_posts_select ON job_posts FOR SELECT USING (true);
CREATE POLICY job_posts_employer ON job_posts FOR ALL USING (
  employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
);
CREATE POLICY job_posts_admin ON job_posts FOR ALL USING (auth.role() = 'service_role');

-- Applications (applicant/employer read own, admin all)
CREATE POLICY applications_applicant ON applications FOR ALL USING (applicant_id = auth.uid()::text);
CREATE POLICY applications_employer ON applications FOR SELECT USING (
  job_post_id IN (SELECT id FROM job_posts WHERE employer_id = auth.uid()::text)
);
CREATE POLICY applications_admin ON applications FOR ALL USING (auth.role() = 'service_role');

-- Interviews (employer/applicant access via application, public read select)
CREATE POLICY interviews_select ON interviews FOR SELECT USING (true);
CREATE POLICY interviews_applicant ON interviews FOR ALL USING (
  application_id IN (SELECT id FROM applications WHERE applicant_id = auth.uid()::text)
);
CREATE POLICY interviews_employer ON interviews FOR ALL USING (
  application_id IN (SELECT id FROM applications WHERE job_id IN (SELECT id FROM job_posts WHERE employer_id = auth.uid()::text))
);
CREATE POLICY interviews_admin ON interviews FOR ALL USING (auth.role() = 'service_role');

-- Verifications (public select, admin full; owners via record_id polymorphic)
CREATE POLICY verifications_select ON verifications FOR SELECT USING (true);
CREATE POLICY verifications_owner ON verifications FOR ALL USING (
  record_id = auth.uid()::text OR verified_by = auth.uid()::text
);
CREATE POLICY verifications_admin ON verifications FOR ALL USING (auth.role() = 'service_role');

-- Applications (refined)
CREATE POLICY applications_select ON applications FOR SELECT USING (true);
CREATE POLICY applications_applicant ON applications FOR ALL USING (applicant_id = auth.uid()::text);
CREATE POLICY applications_employer ON applications FOR SELECT USING (
  job_id IN (SELECT id FROM job_posts WHERE employer_id = auth.uid()::text)
);
CREATE POLICY applications_admin ON applications FOR ALL USING (auth.role() = 'service_role');

-- Reports (reporter read/update own, admin full)
CREATE POLICY reports_select ON reports FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY reports_reporter ON reports FOR ALL USING (reporter_id = auth.uid()::text);
CREATE POLICY reports_admin ON reports FOR ALL USING (auth.role() = 'service_role');

-- Alerts (user own, admin full)
CREATE POLICY alerts_user ON alerts FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY alerts_admin ON alerts FOR ALL USING (auth.role() = 'service_role');

-- Audit logs & services (admin only)
CREATE POLICY audit_logs_admin ON audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY services_admin ON services FOR ALL USING (auth.role() = 'service_role');


