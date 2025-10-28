-- Helper function to verify migration progress from Qdrant to Supabase Vector

CREATE OR REPLACE FUNCTION verify_migration_progress()
RETURNS TABLE (
    total_faces bigint,
    faces_with_embedding bigint,
    faces_with_qdrant_id bigint,
    migration_progress_pct numeric
)
LANGUAGE sql
AS $$
    SELECT
        COUNT(*) as total_faces,
        COUNT(embedding) as faces_with_embedding,
        COUNT(qdrant_point_id) as faces_with_qdrant_id,
        ROUND(100.0 * COUNT(embedding) / NULLIF(COUNT(*), 0), 2) as migration_progress_pct
    FROM faces;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_migration_progress TO authenticated;

COMMENT ON FUNCTION verify_migration_progress IS 'Check migration progress from Qdrant to Supabase Vector';

-- Sample queries for manual verification:

-- Check migration status
-- SELECT * FROM verify_migration_progress();

-- Find faces without embeddings (need migration)
-- SELECT id, profile_id, image_path, qdrant_point_id
-- FROM faces
-- WHERE embedding IS NULL
-- LIMIT 10;

-- Test vector search with sample embedding
-- SELECT * FROM find_similar_faces(
--     (SELECT embedding FROM faces WHERE embedding IS NOT NULL LIMIT 1),
--     0.7,  -- threshold
--     5     -- limit
-- );
