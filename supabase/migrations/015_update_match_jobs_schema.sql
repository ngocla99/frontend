-- Migration 015: Update Match Jobs Schema
-- Description: Add job_type column to support both user and celebrity matching
-- Author: Claude Code
-- Date: 2025-11-01

-- Add job_type column to distinguish match types
ALTER TABLE match_jobs
  ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'both'
  CHECK (job_type IN ('user_match', 'celebrity_match', 'both'));

-- Add index for job_type queries
CREATE INDEX IF NOT EXISTS idx_match_jobs_job_type ON match_jobs(job_type);

-- Create composite index for efficient job queue processing
CREATE INDEX IF NOT EXISTS idx_match_jobs_status_type_created
  ON match_jobs(status, job_type, created_at)
  WHERE status = 'pending';

-- Add comment
COMMENT ON COLUMN match_jobs.job_type IS
  'Type of matching to perform: user_match (user-to-user only), celebrity_match (celebrity only), or both (default)';

-- Update existing jobs to use 'both' type (already default, but making it explicit)
UPDATE match_jobs
SET job_type = 'both'
WHERE job_type IS NULL;

-- Verification query
DO $$
DECLARE
  job_type_col_exists BOOLEAN;
  total_jobs INTEGER;
  jobs_with_type INTEGER;
BEGIN
  -- Check if job_type column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_jobs' AND column_name = 'job_type'
  ) INTO job_type_col_exists;

  -- Count jobs
  SELECT count(*) INTO total_jobs FROM match_jobs;
  SELECT count(*) INTO jobs_with_type FROM match_jobs WHERE job_type IS NOT NULL;

  RAISE NOTICE 'Migration 015 completed: match_jobs schema updated';
  RAISE NOTICE 'job_type column exists: %', job_type_col_exists;
  RAISE NOTICE 'Total jobs: %, Jobs with type: %', total_jobs, jobs_with_type;
  RAISE NOTICE 'Job types available: user_match, celebrity_match, both';
END $$;
