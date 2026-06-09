-- Extended job post fields submitted by employers (schedule, accessibility, posting window)
ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS posting_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS posting_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shifts JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS pwd_friendly BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS senior_friendly BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS accessibility_features JSONB DEFAULT '[]'::JSONB;
