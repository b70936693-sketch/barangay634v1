-- Migration: Match database schema exactly to TypeScript types in types/supabase.ts
-- Drops mismatched tables from 001 and recreates with exact Row types
-- Assumes uuid-ossp extension already enabled from 001
-- FKs: employer_id -> employer_profiles(id), applicant_id -> applicant_profiles(id), etc.
-- user_id/verified_by/reporter_id/actor_id -> users(id)

-- Drop mismatched tables (safe if RLS/policies exist, data loss if populated)
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- applications table (exact match to TypeScript Row)
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES applicant_profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  status TEXT NOT NULL,  -- e.g. 'pending', 'reviewed'
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  data JSONB DEFAULT '{}'::jsonb
);

-- interviews table
CREATE TABLE interviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL,  -- e.g. 'scheduled', 'completed'
  notes TEXT
);

-- verifications table (polymorphic record_id/record_type)
CREATE TABLE verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  record_id UUID NOT NULL,
  record_type TEXT NOT NULL,  -- e.g. 'job_post', 'application'
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  status TEXT NOT NULL,  -- e.g. 'pending', 'verified'
  notes TEXT
);

-- reports table
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,  -- e.g. 'user', 'job_post'
  reason TEXT,
  status TEXT NOT NULL,  -- e.g. 'pending', 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- alerts table
CREATE TABLE alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  severity TEXT NOT NULL,  -- e.g. 'low', 'high'
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- audit_logs table
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  target_table TEXT,
  target_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  details JSONB
);

-- services table
CREATE TABLE services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Performance indexes
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_interviews_application_id ON interviews(application_id);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_read ON alerts(read);
CREATE INDEX idx_verifications_record ON verifications(record_id, record_type);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Enable RLS on all new tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Comment for reference
COMMENT ON TABLE applications IS 'Job applications matching TypeScript schema';

