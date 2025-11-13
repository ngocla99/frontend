-- =====================================================
-- Replicate Model Keep-Alive Cron Job
-- =====================================================
-- Purpose: Keep ngocla99/face-analysis model warm by pinging every 3 minutes
-- This prevents cold starts (3-8 minutes) by ensuring the Replicate container stays active
--
-- Schedule: Every 3 minutes (*/3 * * * *)
-- Frequency: 480 calls/day
-- Estimated Cost: ~$0.00083 × 480 = ~$9.60/month
--
-- Created: 2025-11-13
-- Model: ngocla99/face-analysis (Advanced Face Analysis)
-- Version: eca7af967ef6eb1d8b3c02274421eaff1ebaa9a5ab9a1404d9b0eccfb29a8e48
-- =====================================================

-- Unschedule existing job if it exists (for idempotency)
SELECT cron.unschedule('replicate-keep-alive')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'replicate-keep-alive'
);

-- Schedule Edge Function to run every 3 minutes
SELECT cron.schedule(
  'replicate-keep-alive',
  '*/3 * * * *',  -- Every 3 minutes, 24/7
  $$
  SELECT
    net.http_post(
      url := 'https://lsbzbltpmmtplakdrjvq.supabase.co/functions/v1/replicate-keep-alive',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'source', 'pg_cron',
        'triggered_at', now()
      ),
      timeout_milliseconds := 30000  -- 30 second timeout
    ) as request_id;
  $$
);

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the cron job is scheduled correctly
SELECT
  jobname,
  schedule,
  active,
  command,
  nodename,
  nodeport
FROM cron.job
WHERE jobname = 'replicate-keep-alive';

-- =====================================================
-- Monitoring Queries
-- =====================================================

-- View recent cron job executions (last 10)
-- SELECT
--   start_time,
--   end_time,
--   status,
--   return_message,
--   (end_time - start_time) as duration
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'replicate-keep-alive')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Check if cron job is running on schedule
-- SELECT
--   COUNT(*) as executions_last_hour,
--   MIN(start_time) as first_run,
--   MAX(start_time) as last_run
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'replicate-keep-alive')
--   AND start_time > now() - interval '1 hour';

-- View failed executions
-- SELECT
--   start_time,
--   return_message
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'replicate-keep-alive')
--   AND status = 'failed'
-- ORDER BY start_time DESC
-- LIMIT 10;
