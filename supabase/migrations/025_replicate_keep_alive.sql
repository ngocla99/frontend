-- =====================================================
-- Replicate Model Keep-Alive Cron Job
-- =====================================================
-- Purpose: Keep ngocla99/face-analysis model warm by pinging every 2 minutes
-- This prevents cold starts (3-8 minutes) by ensuring the Replicate container stays active
--
-- Schedule: Every 2 minutes (*/2 * * * *)
-- Frequency: 720 calls/day
-- Prediction Time: ~300ms per call
-- Estimated Cost: $0.000225/second × 0.3 seconds × 720 = ~$1.46/month
--
-- Created: 2025-11-13
-- Updated: 2025-11-13 (Changed from 3min to 2min interval)
-- Model: ngocla99/face-analysis (Advanced Face Analysis)
-- Version: eca7af967ef6eb1d8b3c02274421eaff1ebaa9a5ab9a1404d9b0eccfb29a8e48
-- =====================================================

-- Unschedule existing job if it exists (for idempotency)
SELECT cron.unschedule('replicate-keep-alive')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'replicate-keep-alive'
);

-- Schedule Edge Function to run every 2 minutes
SELECT cron.schedule(
  'replicate-keep-alive',
  '*/2 * * * *',  -- Every 2 minutes, 24/7
  $$
  SELECT
    net.http_post(
      url := 'https://lsbzbltpmmtplakdrjvq.supabase.co/functions/v1/replicate-keep-alive',
      body := jsonb_build_object('source', 'pg_cron', 'triggered_at', now()),
      params := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      timeout_milliseconds := 30000
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
