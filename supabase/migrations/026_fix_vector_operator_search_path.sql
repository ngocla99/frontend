-- Fix search_path for vector operator resolution
-- Issue: Functions had 'SET search_path = extensions, public' which caused
-- PostgreSQL to schema-qualify vector types as extensions.vector, but then
-- couldn't find the <=> operator for those qualified types.
-- Solution: Change to 'public, extensions' to allow proper operator resolution

-- 1. Fix calculate_advanced_similarity
CREATE OR REPLACE FUNCTION calculate_advanced_similarity(
    query_embedding vector,
    query_age integer,
    query_symmetry float,
    query_skin_tone float[],
    query_expression text,
    query_geometry jsonb,
    target_embedding vector,
    target_age integer,
    target_symmetry float,
    target_skin_tone float[],
    target_expression text,
    target_geometry jsonb
)
RETURNS float
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public, extensions  -- FIXED: Changed from 'extensions, public'
AS $$
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
    SELECT value INTO weights FROM system_settings WHERE key = 'matching_weights';

    IF weights IS NOT NULL THEN
        weight_embedding := COALESCE((weights->>'embedding')::float, 0.20);
        weight_geometry := COALESCE((weights->>'geometry')::float, 0.20);
        weight_age := COALESCE((weights->>'age')::float, 0.15);
        weight_symmetry := COALESCE((weights->>'symmetry')::float, 0.15);
        weight_skin_tone := COALESCE((weights->>'skin_tone')::float, 0.15);
        weight_expression := COALESCE((weights->>'expression')::float, 0.15);
    END IF;

    -- 1. Embedding similarity (cosine distance operator)
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

    -- 5. Skin tone similarity (LAB color space Euclidean distance)
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
$$;

-- 2. Fix find_similar_faces_advanced
CREATE OR REPLACE FUNCTION find_similar_faces_advanced(
    query_face_id uuid,
    user_school text,
    user_gender text,
    match_threshold float DEFAULT 0.7,
    match_count integer DEFAULT 20
)
RETURNS TABLE (
    face_id uuid,
    profile_id uuid,
    similarity float,
    image_path text,
    name text,
    age integer,
    expression text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions  -- FIXED: Changed from 'extensions, public'
AS $$
BEGIN
    RETURN QUERY
    WITH query_face AS (
        SELECT f.embedding, f.age, f.symmetry_score, f.skin_tone_lab, f.expression, f.geometry_ratios
        FROM faces f WHERE f.id = query_face_id
    ),
    candidate_matches AS (
        SELECT f.id as face_id, p.id as profile_id,
            calculate_advanced_similarity(qf.embedding, qf.age, qf.symmetry_score, qf.skin_tone_lab, qf.expression, qf.geometry_ratios,
                f.embedding, f.age, f.symmetry_score, f.skin_tone_lab, f.expression, f.geometry_ratios) as similarity,
            f.image_path, p.name, f.age, f.expression
        FROM faces f CROSS JOIN query_face qf JOIN profiles p ON f.profile_id = p.id
        WHERE f.id != query_face_id AND f.embedding IS NOT NULL AND COALESCE(f.quality_score, 0.6) >= 0.6
            AND p.school = user_school AND p.gender != user_gender
    )
    SELECT cm.face_id, cm.profile_id, cm.similarity, cm.image_path, cm.name, cm.age, cm.expression
    FROM candidate_matches cm WHERE cm.similarity >= match_threshold
    ORDER BY cm.similarity DESC LIMIT match_count;
END;
$$;

-- 3. Fix find_celebrity_matches_advanced
CREATE OR REPLACE FUNCTION find_celebrity_matches_advanced(
    query_face_id uuid,
    user_gender text,
    match_threshold float DEFAULT 0.5,
    match_count integer DEFAULT 20,
    category_filter text DEFAULT NULL
)
RETURNS TABLE (
    celebrity_id uuid,
    celebrity_name text,
    similarity float,
    image_path text,
    age integer,
    expression text,
    bio text,
    category text,
    gender text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions  -- FIXED: Changed from 'extensions, public'
AS $$
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
$$;
