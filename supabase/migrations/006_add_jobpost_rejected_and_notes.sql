-- Migration 006: Fix job_posts.status and add published_at + rejection_notes
-- Purpose:
-- 1) Current TS/UI uses: pending | active | closed | rejected
-- 2) Existing schema (001) only allows: active | pending | closed
-- 3) Admin route writes: status "rejected" when dismissing.
-- This migration extends job_posts.status to include "rejected" and
-- adds rejection_notes + published_at columns if missing.

-- Add missing columns (safe if they already exist)
ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_notes TEXT;

-- Drop and recreate status check to include rejected
ALTER TABLE job_posts DROP CONSTRAINT IF EXISTS job_posts_status_check;
ALTER TABLE job_posts
  ADD CONSTRAINT job_posts_status_check
  CHECK (status IN ('active', 'pending', 'closed', 'rejected'));

