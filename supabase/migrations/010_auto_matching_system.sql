-- Auto-Match Generation System
-- Created: 2025-10-30
-- Purpose: Automatically generate face matches when users upload photos
-- Architecture: pg_cron + Supabase Edge Functions (no Redis)

-- ============================================================================
-- STEP 1: Enable pg_cron extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- STEP 2: Create job queue table
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  face_id uuid NOT NULL REFERENCES faces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  embedding vector(512) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Index for efficient job polling
CREATE INDEX IF NOT EXISTS idx_match_jobs_pending
ON match_jobs(created_at)
WHERE status = 'pending';

-- Index for monitoring
CREATE INDEX IF NOT EXISTS idx_match_jobs_status
ON match_jobs(status, created_at);

-- Add comments
COMMENT ON TABLE match_jobs IS 'Queue for background face matching jobs';
COMMENT ON COLUMN match_jobs.embedding IS '512-dimensional face embedding vector from InsightFace';
COMMENT ON COLUMN match_jobs.status IS 'Job status: pending (queued), processing (running), completed (done), failed (error)';

-- ============================================================================
-- STEP 3: Create filtered similarity search function
-- ============================================================================
CREATE OR REPLACE FUNCTION find_similar_faces_filtered(
    query_embedding vector(512),
    user_school text,
    user_gender text,
    exclude_profile_id uuid DEFAULT NULL,
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 20
)
RETURNS TABLE (
    face_id uuid,
    profile_id uuid,
    similarity float,
    image_path text,
    profile_name text,
    profile_gender text,
    profile_school text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id as face_id,
        f.profile_id,
        (1 - (f.embedding <=> query_embedding))::float as similarity,
        f.image_path,
        p.name as profile_name,
        p.gender as profile_gender,
        p.school as profile_school
    FROM faces f
    JOIN profiles p ON f.profile_id = p.id
    WHERE
        f.embedding IS NOT NULL
        AND p.profile_type = 'user'  -- Only match with users (not celebrities)
        AND p.school = user_school  -- Same school
        AND p.gender != user_gender  -- Opposite gender
        AND (exclude_profile_id IS NULL OR f.profile_id != exclude_profile_id)  -- Exclude self
        AND (1 - (f.embedding <=> query_embedding)) >= match_threshold  -- Above similarity threshold
    ORDER BY f.embedding <=> query_embedding  -- Sort by cosine distance (ascending)
    LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_similar_faces_filtered TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_faces_filtered TO service_role;

-- Add comment
COMMENT ON FUNCTION find_similar_faces_filtered IS
'Find similar faces filtered by school and gender. Used for automatic match generation on photo upload.';

-- ============================================================================
-- STEP 4: Add performance indexes
-- ============================================================================

-- Index for school + gender filtering (improves query performance)
CREATE INDEX IF NOT EXISTS idx_profiles_school_gender
ON profiles(school, gender)
WHERE profile_type = 'user';

-- ============================================================================
-- STEP 5: Schedule pg_cron job to trigger Edge Function
-- ============================================================================

-- NOTE: Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference
-- Example: https://abcdefghijklmnop.supabase.co
--
-- To find your project ref:
-- 1. Go to Supabase Dashboard
-- 2. Settings → API
-- 3. Look at "Project URL" (e.g., https://abcdefghijklmnop.supabase.co)
--
-- IMPORTANT: You must also set the service_role_key in pg_cron settings:
-- ALTER DATABASE postgres SET app.settings.service_role_key TO 'your-service-role-key-here';

-- Unschedule existing job if it exists (for re-running migration)
SELECT cron.unschedule('process-match-jobs') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-match-jobs'
);

-- Schedule Edge Function to run every minute
-- This will process ONE pending job per minute to avoid overload
SELECT cron.schedule(
  'process-match-jobs',  -- Job name
  '* * * * *',  -- Run every minute (cron format: min hour day month weekday)
  $$
  SELECT
    net.http_post(
      url := 'https://lsbzbltpmmtplakdrjvq.supabase.co/functions/v1/match-generator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'source', 'pg_cron',
        'triggered_at', now()
      )
    ) as request_id;
  $$
);

-- ============================================================================
-- STEP 6: Create helper functions for monitoring
-- ============================================================================

-- Function to get job queue statistics
CREATE OR REPLACE FUNCTION get_match_job_stats()
RETURNS TABLE (
    status text,
    count bigint,
    oldest_job timestamptz
)
LANGUAGE sql
AS $$
    SELECT
        status,
        COUNT(*)::bigint as count,
        MIN(created_at) as oldest_job
    FROM match_jobs
    GROUP BY status
    ORDER BY
        CASE status
            WHEN 'pending' THEN 1
            WHEN 'processing' THEN 2
            WHEN 'completed' THEN 3
            WHEN 'failed' THEN 4
        END;
$$;

GRANT EXECUTE ON FUNCTION get_match_job_stats TO authenticated;

COMMENT ON FUNCTION get_match_job_stats IS 'Get statistics about match job queue status';

-- ============================================================================
-- STEP 7: Row Level Security (RLS) policies for match_jobs
-- ============================================================================

-- Enable RLS
ALTER TABLE match_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own match jobs"
ON match_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role can do everything (for Edge Function)
CREATE POLICY "Service role has full access to match jobs"
ON match_jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 8: Create function to clean up old completed/failed jobs
-- ============================================================================

-- Function to clean up jobs older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_match_jobs()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM match_jobs
    WHERE status IN ('completed', 'failed')
      AND created_at < now() - interval '7 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_old_match_jobs TO service_role;

COMMENT ON FUNCTION cleanup_old_match_jobs IS
'Delete completed/failed jobs older than 7 days to prevent table bloat';

-- Schedule cleanup to run daily at 3 AM
SELECT cron.schedule(
  'cleanup-match-jobs',
  '0 3 * * *',  -- Daily at 3 AM
  $$
  SELECT cleanup_old_match_jobs();
  $$
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify extensions
DO $$
BEGIN
    RAISE NOTICE 'Verifying extensions...';

    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE NOTICE '✓ pg_cron extension enabled';
    ELSE
        RAISE WARNING '✗ pg_cron extension not found';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE NOTICE '✓ pgvector extension enabled';
    ELSE
        RAISE WARNING '✗ pgvector extension not found';
    END IF;
END $$;

-- Verify table created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'match_jobs') THEN
        RAISE NOTICE '✓ match_jobs table created';
    ELSE
        RAISE WARNING '✗ match_jobs table not found';
    END IF;
END $$;

-- Verify function created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'find_similar_faces_filtered') THEN
        RAISE NOTICE '✓ find_similar_faces_filtered function created';
    ELSE
        RAISE WARNING '✗ find_similar_faces_filtered function not found';
    END IF;
END $$;

-- Verify cron jobs scheduled
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-match-jobs') THEN
        RAISE NOTICE '✓ pg_cron job scheduled: process-match-jobs';
    ELSE
        RAISE WARNING '✗ pg_cron job not scheduled: process-match-jobs';
    END IF;

    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-match-jobs') THEN
        RAISE NOTICE '✓ pg_cron job scheduled: cleanup-match-jobs';
    ELSE
        RAISE WARNING '✗ pg_cron job not scheduled: cleanup-match-jobs';
    END IF;
END $$;

-- Display scheduled jobs
SELECT
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname IN ('process-match-jobs', 'cleanup-match-jobs');

-- ============================================================================
-- MANUAL SETUP INSTRUCTIONS
-- ============================================================================

-- After running this migration, you MUST:
--
-- 1. Update the project URL in the pg_cron schedule above
--    Replace: https://YOUR_PROJECT_REF.supabase.co
--    With your actual Supabase project URL
--
-- 2. Set the service role key for pg_cron:
--    ALTER DATABASE postgres SET app.settings.service_role_key TO 'your-service-role-key';
--
-- 3. Deploy the Edge Function:
--    cd supabase/functions
--    supabase functions deploy match-generator
--
-- 4. Test the system:
--    - Upload a photo via POST /api/faces
--    - Check match_jobs table for pending job
--    - Wait 60 seconds for pg_cron
--    - Verify job status changed to 'completed'
--    - Check matches table for new matches
