-- Function: Find similar faces using cosine similarity
-- Used for user-to-user matching across the platform

CREATE OR REPLACE FUNCTION find_similar_faces(
    query_embedding vector(512),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 20,
    exclude_profile_id uuid DEFAULT NULL
)
RETURNS TABLE (
    face_id uuid,
    profile_id uuid,
    similarity float,
    image_path text,
    profile_name text,
    profile_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id as face_id,
        f.profile_id,
        1 - (f.embedding <=> query_embedding) as similarity,  -- Convert cosine distance to similarity
        f.image_path,
        p.name as profile_name,
        p.profile_type
    FROM faces f
    JOIN profiles p ON f.profile_id = p.id
    WHERE
        f.embedding IS NOT NULL  -- Only search faces with embeddings
        AND (exclude_profile_id IS NULL OR f.profile_id != exclude_profile_id)  -- Exclude self-matches
        AND (1 - (f.embedding <=> query_embedding)) >= match_threshold  -- Filter by similarity threshold
    ORDER BY f.embedding <=> query_embedding  -- Sort by cosine distance (ascending)
    LIMIT match_count;
END;
$$;

-- Function: Find celebrity lookalikes
-- Specialized function for matching user faces to celebrity database

CREATE OR REPLACE FUNCTION find_celebrity_matches(
    query_embedding vector(512),
    match_count int DEFAULT 10
)
RETURNS TABLE (
    face_id uuid,
    celebrity_name text,
    similarity float,
    image_path text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id as face_id,
        p.name as celebrity_name,
        1 - (f.embedding <=> query_embedding) as similarity,
        f.image_path
    FROM faces f
    JOIN profiles p ON f.profile_id = p.id
    WHERE
        f.embedding IS NOT NULL
        AND p.profile_type = 'celebrity'  -- Only search celebrity profiles
    ORDER BY f.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION find_similar_faces TO authenticated;
GRANT EXECUTE ON FUNCTION find_celebrity_matches TO authenticated;

-- Add function comments
COMMENT ON FUNCTION find_similar_faces IS 'Find similar faces using cosine similarity search with pgvector HNSW index';
COMMENT ON FUNCTION find_celebrity_matches IS 'Find celebrity lookalikes for a given face embedding';

-- Distance operators in pgvector:
-- <->  : Euclidean distance (L2)
-- <=>  : Cosine distance (1 - cosine similarity) ✅ USE THIS for face matching
-- <#>  : Inner product (dot product)
--
-- Why cosine distance?
-- - InsightFace embeddings are L2-normalized
-- - Cosine similarity is standard for face recognition
-- - Range: 0 (identical) to 2 (opposite)
-- - Similarity = 1 - distance
