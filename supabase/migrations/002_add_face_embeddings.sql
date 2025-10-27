-- Add vector column for 512-dimensional face embeddings
-- InsightFace model generates 512-dimensional normalized embeddings

ALTER TABLE faces
ADD COLUMN IF NOT EXISTS embedding vector(512);

-- Add comment for documentation
COMMENT ON COLUMN faces.embedding IS '512-dimensional face embedding from InsightFace model (normalized L2)';

-- Create HNSW index for fast similarity search
-- HNSW (Hierarchical Navigable Small World) is recommended for:
-- - Better search accuracy than IVFFlat
-- - Faster queries (important for real-time matching)
-- - Acceptable build time for datasets < 100k vectors

-- Parameters:
-- - m = 16: connections per layer (higher = better accuracy, more memory)
-- - ef_construction = 64: build time quality (higher = better index, slower build)
-- - vector_cosine_ops: use cosine distance (best for normalized embeddings)

CREATE INDEX IF NOT EXISTS faces_embedding_hnsw_idx
ON faces
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Alternative IVFFlat index (faster build, requires tuning):
-- CREATE INDEX IF NOT EXISTS faces_embedding_ivfflat_idx
-- ON faces
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- Verify index creation
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'faces'
  AND indexname LIKE '%embedding%';
