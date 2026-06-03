-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS on all tables after creation

-- users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employer', 'applicant')),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'verified', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- employer_profiles table  
CREATE TABLE employer_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  headline TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT false,
  business_type TEXT
);

-- applicant_profiles table
CREATE TABLE applicant_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  preferred_name TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  barangay TEXT NOT NULL,
  address TEXT,
  headline TEXT,
  bio TEXT,
  skills JSONB DEFAULT '[]'::JSONB,
  documents_ready JSONB DEFAULT '[]'::JSONB
);

-- job_posts table
CREATE TABLE job_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employer_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position TEXT NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('establishment_job', 'resident_service')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'closed')),
  qualifications TEXT,
  requirements TEXT,
  description TEXT,
  employment_type TEXT,
  schedule TEXT,
  salary TEXT,
  urgency TEXT,
  benefits JSONB DEFAULT '[]'::JSONB,
  employer_requirements JSONB DEFAULT '[]'::JSONB,
  admin_requirements JSONB DEFAULT '[]'::JSONB
);

-- applications table
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES applicant_profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT NOT NULL,
  position TEXT NOT NULL,
  applied_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewing', 'for_interview', 'hired', 'rejected')),
  availability TEXT,
  shift_preference TEXT,
  introduction TEXT,
  documents JSONB DEFAULT '[]'::JSONB
);

-- interviews table
CREATE TABLE interviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  position TEXT NOT NULL,
  contact TEXT NOT NULL,
  interview_date DATE,
  interview_time TEXT,
  location TEXT
);

-- verifications table
CREATE TABLE verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Applicant Verification', 'Employer Verification')),
  subject_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- reports table
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT,
  subject TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT CHECK (status IN ('open', 'in_review', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- alerts table
CREATE TABLE alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  description TEXT NOT NULL,
  level TEXT CHECK (level IN ('low', 'medium', 'high')),
  status TEXT CHECK (status IN ('active', 'monitoring', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_logs table
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  target TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- services table
CREATE TABLE services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  applications INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'paused'))
);

-- Indexes for performance
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_job_posts_status ON job_posts(status);
CREATE INDEX idx_applications_job_post_id ON applications(job_post_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Note: Add RLS policies separately after basic auth setup
