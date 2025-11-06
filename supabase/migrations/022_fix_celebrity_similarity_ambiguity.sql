-- Migration: Fix Celebrity Matching Ambiguous Similarity Column
-- Created: 2025-11-06
-- Description: Fixes PostgreSQL error 42702 "column reference 'similarity' is ambiguous" in find_celebrity_matches_advanced function

-- Drop the existing function
DROP FUNCTION IF EXISTS find_celebrity_matches_advanced(uuid, text, float, int, text);

-- Recreate with qualified column references to fix ambiguity
CREATE OR REPLACE FUNCTION find_celebrity_matches_advanced(
    query_face_id uuid,
    user_gender text,
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 20,
    category_filter text DEFAULT NULL
) RETURNS TABLE (
    celebrity_id uuid,
    celebrity_name text,
    similarity float,
    image_path text,
    age int,
    expression text,
    bio text,
    category text,
    gender text
) AS $$
BEGIN
    RETURN QUERY
    WITH query_face AS (
        SELECT
            f.embedding,
            f.age,
            f.symmetry_score,
            f.skin_tone_lab,
            f.expression,
            f.geometry_ratios
        FROM faces f
        WHERE f.id = query_face_id
    ),
    candidate_matches AS (
        SELECT
            c.id as celebrity_id,
            c.name as celebrity_name,
            calculate_advanced_similarity(
                qf.embedding, qf.age, qf.symmetry_score, qf.skin_tone_lab, qf.expression, qf.geometry_ratios,
                c.embedding, c.age, c.symmetry_score, c.skin_tone_lab, c.expression, c.geometry_ratios
            ) as similarity,
            c.image_path,
            c.age,
            c.expression,
            c.bio,
            c.category,
            c.gender
        FROM celebrities c
        CROSS JOIN query_face qf
        WHERE
            c.embedding IS NOT NULL
            AND COALESCE(c.quality_score, 0.6) >= 0.6  -- Quality gate: reject poor images
            AND c.gender != user_gender  -- Opposite gender filter
            AND (category_filter IS NULL OR c.category = category_filter)  -- Optional category filter
    )
    -- FIX: Explicitly qualify column references to avoid ambiguity
    SELECT
        candidate_matches.celebrity_id,
        candidate_matches.celebrity_name,
        candidate_matches.similarity,
        candidate_matches.image_path,
        candidate_matches.age,
        candidate_matches.expression,
        candidate_matches.bio,
        candidate_matches.category,
        candidate_matches.gender
    FROM candidate_matches
    WHERE candidate_matches.similarity >= match_threshold
    ORDER BY candidate_matches.similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_celebrity_matches_advanced IS 'Find celebrity matches using advanced 6-factor matching algorithm with quality gate (0.6+) and opposite gender filtering. Reuses calculate_advanced_similarity() from migration 019. Fixed ambiguous column reference in v022.';
