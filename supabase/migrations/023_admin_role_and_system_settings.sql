-- Migration: Admin Role and System Settings
-- Created: 2025-11-11
-- Description: Adds admin role to profiles and creates system_settings table for configurable app settings

-- ============================================
-- 1. Add role column to profiles table
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin'));

COMMENT ON COLUMN public.profiles.role IS 'User role: user (default) or admin (full system access)';

-- Create index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role = 'admin';


-- ============================================
-- 2. Create system_settings table
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.system_settings IS 'Configurable system settings managed by admins';
COMMENT ON COLUMN public.system_settings.key IS 'Unique setting identifier (e.g., matching_weights, allow_non_edu_emails)';
COMMENT ON COLUMN public.system_settings.value IS 'JSON value for the setting (supports complex types)';
COMMENT ON COLUMN public.system_settings.updated_by IS 'Admin user who last updated this setting';

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON public.system_settings(updated_at DESC);


-- ============================================
-- 3. Seed default settings
-- ============================================

-- Matching algorithm weights (6 factors summing to 1.0)
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'matching_weights',
    '{
        "embedding": 0.20,
        "geometry": 0.20,
        "age": 0.15,
        "symmetry": 0.15,
        "skin_tone": 0.15,
        "expression": 0.15
    }'::jsonb,
    'Weights for the 6-factor matching algorithm (must sum to 1.0)'
) ON CONFLICT (key) DO NOTHING;

-- Email validation setting (replaces DEV_ALLOW_NON_EDU_EMAILS env var)
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'allow_non_edu_emails',
    'false'::jsonb,
    'Allow non-.edu email addresses to register (true/false)'
) ON CONFLICT (key) DO NOTHING;

-- Match threshold (minimum similarity score to create a match)
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'match_threshold',
    '0.5'::jsonb,
    'Minimum similarity score (0.0-1.0) required to create a match'
) ON CONFLICT (key) DO NOTHING;


-- ============================================
-- 4. Enable RLS on system_settings
-- ============================================
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view settings
CREATE POLICY "Anyone can view system settings"
    ON public.system_settings
    FOR SELECT
    USING (true);

-- Policy: Only admins can update settings
CREATE POLICY "Only admins can update system settings"
    ON public.system_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Only admins can insert new settings
CREATE POLICY "Only admins can insert system settings"
    ON public.system_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Only admins can delete settings
CREATE POLICY "Only admins can delete system settings"
    ON public.system_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );


-- ============================================
-- 5. Helper function: Get setting value
-- ============================================
CREATE OR REPLACE FUNCTION get_setting(setting_key TEXT, default_value JSONB DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT value INTO result
    FROM public.system_settings
    WHERE key = setting_key;

    RETURN COALESCE(result, default_value);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_setting IS 'Retrieve a setting value by key with optional default';


-- ============================================
-- 6. Update calculate_advanced_similarity to use dynamic weights
-- ============================================
CREATE OR REPLACE FUNCTION calculate_advanced_similarity(
    -- Query face attributes
    query_embedding vector(512),
    query_age int,
    query_symmetry float,
    query_skin_tone float[],
    query_expression text,
    query_geometry jsonb,
    -- Target face attributes
    target_embedding vector(512),
    target_age int,
    target_symmetry float,
    target_skin_tone float[],
    target_expression text,
    target_geometry jsonb
) RETURNS float AS $$
DECLARE
    embedding_sim float;
    geometry_sim float;
    age_compat float;
    symmetry_avg float;
    skin_tone_sim float;
    expression_match float;
    final_score float;
    geom_distance float;
    skin_distance float;

    -- Dynamic weights from system_settings
    weights JSONB;
    weight_embedding float := 0.20;  -- Defaults
    weight_geometry float := 0.20;
    weight_age float := 0.15;
    weight_symmetry float := 0.15;
    weight_skin_tone float := 0.15;
    weight_expression float := 0.15;
BEGIN
    -- Fetch weights from system_settings (with fallback to defaults)
    SELECT value INTO weights FROM public.system_settings WHERE key = 'matching_weights';

    IF weights IS NOT NULL THEN
        weight_embedding := COALESCE((weights->>'embedding')::float, 0.20);
        weight_geometry := COALESCE((weights->>'geometry')::float, 0.20);
        weight_age := COALESCE((weights->>'age')::float, 0.15);
        weight_symmetry := COALESCE((weights->>'symmetry')::float, 0.15);
        weight_skin_tone := COALESCE((weights->>'skin_tone')::float, 0.15);
        weight_expression := COALESCE((weights->>'expression')::float, 0.15);
    END IF;

    -- 1. Embedding similarity
    embedding_sim := 1 - (query_embedding <=> target_embedding);

    -- 2. Geometry ratio similarity
    geom_distance := sqrt(
        power(COALESCE((query_geometry->>'face_width_height_ratio')::float, 0.75) -
              COALESCE((target_geometry->>'face_width_height_ratio')::float, 0.75), 2) +
        power(COALESCE((query_geometry->>'eye_spacing_face_width')::float, 0.42) -
              COALESCE((target_geometry->>'eye_spacing_face_width')::float, 0.42), 2) +
        power(COALESCE((query_geometry->>'jawline_width_face_width')::float, 0.68) -
              COALESCE((target_geometry->>'jawline_width_face_width')::float, 0.68), 2) +
        power(COALESCE((query_geometry->>'nose_width_face_width')::float, 0.25) -
              COALESCE((target_geometry->>'nose_width_face_width')::float, 0.25), 2)
    );
    geometry_sim := 1.0 - LEAST(geom_distance / 1.0, 1.0);

    -- 3. Age compatibility
    age_compat := CASE
        WHEN abs(COALESCE(query_age, 25) - COALESCE(target_age, 25)) <= 2 THEN 1.0
        WHEN abs(COALESCE(query_age, 25) - COALESCE(target_age, 25)) <= 5 THEN 0.9
        WHEN abs(COALESCE(query_age, 25) - COALESCE(target_age, 25)) <= 10 THEN 0.7
        ELSE 0.5
    END;

    -- 4. Symmetry average
    symmetry_avg := (COALESCE(query_symmetry, 0.75) + COALESCE(target_symmetry, 0.75)) / 2.0;

    -- 5. Skin tone similarity
    skin_distance := sqrt(
        power(COALESCE(query_skin_tone[1], 65.0) - COALESCE(target_skin_tone[1], 65.0), 2) +
        power(COALESCE(query_skin_tone[2], 10.0) - COALESCE(target_skin_tone[2], 10.0), 2) +
        power(COALESCE(query_skin_tone[3], 20.0) - COALESCE(target_skin_tone[3], 20.0), 2)
    );
    skin_tone_sim := 1.0 - LEAST(skin_distance / 100.0, 1.0);

    -- 6. Expression match
    expression_match := CASE
        WHEN COALESCE(query_expression, 'neutral') = COALESCE(target_expression, 'neutral') THEN 1.0
        WHEN query_expression IN ('happy', 'smile') AND target_expression IN ('happy', 'smile') THEN 0.9
        ELSE 0.6
    END;

    -- 7. Composite weighted score using dynamic weights
    final_score :=
        weight_embedding * COALESCE(embedding_sim, 0.0) +
        weight_geometry * COALESCE(geometry_sim, 0.0) +
        weight_age * COALESCE(age_compat, 0.5) +
        weight_symmetry * COALESCE(symmetry_avg, 0.75) +
        weight_skin_tone * COALESCE(skin_tone_sim, 0.0) +
        weight_expression * COALESCE(expression_match, 0.6);

    RETURN GREATEST(LEAST(final_score, 1.0), 0.0);
END;
$$ LANGUAGE plpgsql STABLE;  -- Changed from IMMUTABLE to STABLE since we read from a table

COMMENT ON FUNCTION calculate_advanced_similarity IS 'Calculate 0-1 similarity score using 6-factor weighted algorithm with dynamic weights from system_settings table';
