-- Enable pgvector extension for vector similarity search
-- This extension adds support for vector data types and similarity search operations

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
-- Expected: vector extension should be listed with version 0.8.0 or higher
SELECT
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname = 'vector';

-- Add comment for documentation
COMMENT ON EXTENSION vector IS 'Vector similarity search for PostgreSQL - used for face embeddings';
