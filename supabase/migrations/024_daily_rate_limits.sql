-- Migration: Daily Rate Limits for Baby Generation and Photo Uploads
-- Created: 2025-11-12
-- Description: Adds daily usage quotas tracking and configurable limits for baby generation and photo uploads

-- ============================================
-- 1. Create user_daily_quotas table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_daily_quotas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    baby_generations_count int NOT NULL DEFAULT 0 CHECK (baby_generations_count >= 0),
    photo_uploads_count int NOT NULL DEFAULT 0 CHECK (photo_uploads_count >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, date)
);

COMMENT ON TABLE public.user_daily_quotas IS 'Tracks daily usage quotas for baby generation and photo uploads per user';
COMMENT ON COLUMN public.user_daily_quotas.user_id IS 'User this quota record belongs to';
COMMENT ON COLUMN public.user_daily_quotas.date IS 'UTC date for this quota (resets at midnight UTC)';
COMMENT ON COLUMN public.user_daily_quotas.baby_generations_count IS 'Number of babies generated today';
COMMENT ON COLUMN public.user_daily_quotas.photo_uploads_count IS 'Number of photos uploaded today';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_daily_quotas_user_date ON public.user_daily_quotas(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_daily_quotas_date ON public.user_daily_quotas(date);


-- ============================================
-- 2. Add rate limit settings to system_settings
-- ============================================

-- Baby generation daily limit (default: 10 per day)
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'daily_baby_generation_limit',
    '10'::jsonb,
    'Maximum baby generations allowed per user per day (0 = blocked, -1 = unlimited)'
) ON CONFLICT (key) DO NOTHING;

-- Photo upload daily limit (default: 5 per day)
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'daily_photo_upload_limit',
    '5'::jsonb,
    'Maximum photo uploads allowed per user per day (0 = blocked, -1 = unlimited)'
) ON CONFLICT (key) DO NOTHING;


-- ============================================
-- 3. Enable RLS on user_daily_quotas
-- ============================================
ALTER TABLE public.user_daily_quotas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own quotas
CREATE POLICY "Users can view own quotas"
    ON public.user_daily_quotas
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: System can insert quotas (via service role in API routes)
-- Note: No user-facing INSERT policy - only API routes with service role can insert
-- This prevents users from manipulating their quotas

-- Policy: Admins can view all quotas
CREATE POLICY "Admins can view all quotas"
    ON public.user_daily_quotas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );


-- ============================================
-- 4. Auto-cleanup function for old quota records
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_daily_quotas()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_daily_quotas
    WHERE date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_daily_quotas IS 'Deletes quota records older than 90 days to prevent table growth';


-- ============================================
-- 5. Schedule daily cleanup job with pg_cron
-- ============================================
-- Note: pg_cron should already be enabled from migration 010_auto_matching_system.sql
-- If not enabled, uncomment the line below:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup to run daily at 2 AM UTC
SELECT cron.schedule(
    'cleanup-old-daily-quotas',
    '0 2 * * *',  -- Every day at 2 AM UTC
    $$SELECT cleanup_old_daily_quotas();$$
);


-- ============================================
-- 6. Helper function: Check daily limit
-- ============================================
CREATE OR REPLACE FUNCTION check_daily_limit(
    p_user_id uuid,
    p_limit_type text,
    p_limit_key text
)
RETURNS TABLE (
    allowed boolean,
    current_count int,
    limit_value int,
    reset_at timestamptz
) AS $$
DECLARE
    v_current_count int := 0;
    v_limit_value int;
    v_limit_jsonb jsonb;
BEGIN
    -- Get the limit from system_settings
    SELECT value INTO v_limit_jsonb
    FROM public.system_settings
    WHERE key = p_limit_key;

    -- Extract integer value from JSONB
    -- Default to -1 (unlimited) if setting doesn't exist
    IF v_limit_jsonb IS NULL THEN
        v_limit_value := -1;  -- -1 = unlimited
    ELSE
        v_limit_value := (v_limit_jsonb)::text::int;
    END IF;

    -- Get current count for today
    IF p_limit_type = 'baby_generations' THEN
        SELECT COALESCE(baby_generations_count, 0)
        INTO v_current_count
        FROM public.user_daily_quotas
        WHERE user_id = p_user_id AND date = CURRENT_DATE;
    ELSIF p_limit_type = 'photo_uploads' THEN
        SELECT COALESCE(photo_uploads_count, 0)
        INTO v_current_count
        FROM public.user_daily_quotas
        WHERE user_id = p_user_id AND date = CURRENT_DATE;
    END IF;

    -- Default to 0 if no record exists
    v_current_count := COALESCE(v_current_count, 0);

    -- Calculate allowed status:
    -- - If limit is -1: unlimited (always allowed)
    -- - If limit is 0: blocked (never allowed)
    -- - Otherwise: allowed if current_count < limit
    RETURN QUERY SELECT
        CASE
            WHEN v_limit_value = -1 THEN true   -- -1 = unlimited
            WHEN v_limit_value = 0 THEN false   -- 0 = blocked
            ELSE v_current_count < v_limit_value  -- Check against limit
        END as allowed,
        v_current_count as current_count,
        v_limit_value as limit_value,
        (CURRENT_DATE + INTERVAL '1 day')::timestamptz as reset_at;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_daily_limit IS 'Check if user has reached daily limit. -1 = unlimited, 0 = blocked, >0 = limit value';


-- ============================================
-- 7. Helper function: Increment daily usage
-- ============================================
CREATE OR REPLACE FUNCTION increment_daily_usage(
    p_user_id uuid,
    p_limit_type text
)
RETURNS void AS $$
BEGIN
    IF p_limit_type = 'baby_generations' THEN
        INSERT INTO public.user_daily_quotas (user_id, date, baby_generations_count, photo_uploads_count)
        VALUES (p_user_id, CURRENT_DATE, 1, 0)
        ON CONFLICT (user_id, date)
        DO UPDATE SET
            baby_generations_count = public.user_daily_quotas.baby_generations_count + 1,
            updated_at = now();
    ELSIF p_limit_type = 'photo_uploads' THEN
        INSERT INTO public.user_daily_quotas (user_id, date, baby_generations_count, photo_uploads_count)
        VALUES (p_user_id, CURRENT_DATE, 0, 1)
        ON CONFLICT (user_id, date)
        DO UPDATE SET
            photo_uploads_count = public.user_daily_quotas.photo_uploads_count + 1,
            updated_at = now();
    END IF;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION increment_daily_usage IS 'Atomically increment daily usage counter for a specific quota type';
