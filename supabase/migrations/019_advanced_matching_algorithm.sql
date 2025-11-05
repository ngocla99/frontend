-- Migration: Advanced Multi-Factor Matching Algorithm
-- Created: 2025-11-05
-- Description: Implements sophisticated 6-factor matching algorithm with weighted composite scoring

-- Function to calculate advanced similarity score between two faces
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
BEGIN
    -- 1. Embedding similarity (20% weight)
    -- Cosine similarity via pgvector distance operator
    embedding_sim := 1 - (query_embedding <=> target_embedding);

    -- 2. Geometry ratio similarity (20% weight)
    -- Compare facial proportions using Euclidean distance
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
    -- Normalize: max expected distance ~1.0
    geometry_sim := 1.0 - LEAST(geom_distance / 1.0, 1.0);

    -- 3. Age compatibility (15% weight)
    -- Bonus for similar ages, penalty for large gaps
    age_compat := CASE
        WHEN abs(COALESCE(query_age, 25) - COALESCE(target_age, 25)) <= 2 THEN 1.0
        WHEN abs(COALESCE(query_age, 25) - COALESCE(target_age, 25)) <= 5 THEN 0.9
        WHEN abs(COALESCE(query_age, 25) - COALESCE(target_age, 25)) <= 10 THEN 0.7
        ELSE 0.5
    END;

    -- 4. Symmetry average (15% weight)
    -- Higher symmetry = more attractive matching
    symmetry_avg := (COALESCE(query_symmetry, 0.75) + COALESCE(target_symmetry, 0.75)) / 2.0;

    -- 5. Skin tone similarity (15% weight)
    -- CIELAB color distance (perceptually uniform)
    skin_distance := sqrt(
        power(COALESCE(query_skin_tone[1], 65.0) - COALESCE(target_skin_tone[1], 65.0), 2) +
        power(COALESCE(query_skin_tone[2], 10.0) - COALESCE(target_skin_tone[2], 10.0), 2) +
        power(COALESCE(query_skin_tone[3], 20.0) - COALESCE(target_skin_tone[3], 20.0), 2)
    );
    -- Normalize: typical max CIELAB distance ~100
    skin_tone_sim := 1.0 - LEAST(skin_distance / 100.0, 1.0);

    -- 6. Expression match (15% weight)
    -- Bonus for matching expressions
    expression_match := CASE
        WHEN COALESCE(query_expression, 'neutral') = COALESCE(target_expression, 'neutral') THEN 1.0
        WHEN query_expression IN ('happy', 'smile') AND target_expression IN ('happy', 'smile') THEN 0.9
        ELSE 0.6
    END;

    -- 7. Composite weighted score (updated weights - removed gender)
    final_score :=
        0.20 * COALESCE(embedding_sim, 0.0) +
        0.20 * COALESCE(geometry_sim, 0.0) +
        0.15 * COALESCE(age_compat, 0.5) +
        0.15 * COALESCE(symmetry_avg, 0.75) +
        0.15 * COALESCE(skin_tone_sim, 0.0) +
        0.15 * COALESCE(expression_match, 0.6);

    RETURN GREATEST(LEAST(final_score, 1.0), 0.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_advanced_similarity IS 'Calculate 0-1 similarity score using 6-factor weighted algorithm: 20% embeddings, 20% geometry, 15% age, 15% symmetry, 15% skin tone, 15% expression';


-- Enhanced find_similar_faces function with advanced scoring
CREATE OR REPLACE FUNCTION find_similar_faces_advanced(
    query_face_id uuid,
    user_school text,
    user_gender text,
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 20
) RETURNS TABLE (
    face_id uuid,
    profile_id uuid,
    similarity float,
    image_path text,
    name text,
    age int,
    expression text
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
    )
    SELECT
        f.id as face_id,
        p.id as profile_id,
        calculate_advanced_similarity(
            qf.embedding, qf.age, qf.symmetry_score, qf.skin_tone_lab, qf.expression, qf.geometry_ratios,
            f.embedding, f.age, f.symmetry_score, f.skin_tone_lab, f.expression, f.geometry_ratios
        ) as similarity,
        f.image_path,
        p.name,
        f.age,
        f.expression
    FROM faces f
    CROSS JOIN query_face qf
    JOIN profiles p ON f.profile_id = p.id
    WHERE
        f.id != query_face_id
        AND f.embedding IS NOT NULL
        AND COALESCE(f.quality_score, 0.6) >= 0.6  -- Quality gate: reject poor images
        AND p.school = user_school
        AND p.gender != user_gender  -- Gender already filtered here (no need in scoring)
        AND p.profile_type = 'user'
    HAVING calculate_advanced_similarity(
        qf.embedding, qf.age, qf.symmetry_score, qf.skin_tone_lab, qf.expression, qf.geometry_ratios,
        f.embedding, f.age, f.symmetry_score, f.skin_tone_lab, f.expression, f.geometry_ratios
    ) >= match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_similar_faces_advanced IS 'Find similar faces using advanced multi-factor matching algorithm with quality gate (0.6+) and school/gender filtering';
