-- Add applicant_count column to job_posts
ALTER TABLE job_posts ADD COLUMN applicant_count INTEGER DEFAULT 0;
CREATE INDEX idx_job_posts_applicant_count ON job_posts(applicant_count);

