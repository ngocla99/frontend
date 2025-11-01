-- Migration 014: Update Celebrity Vector Search Functions
-- Description: Update find_celebrity_matches to query the new celebrities table
-- Author: Claude Code
-- Date: 2025-11-01

-- Drop old function if exists (from migration 003)
DROP FUNCTION IF EXISTS find_celebrity_matches(vector, int);
DROP FUNCTION IF EXISTS find_celebrity_matches(vector, int, text);
DROP FUNCTION IF EXISTS find_celebrity_matches(vector, int, text, text);

-- Create new function that queries celebrities table directly
CREATE OR REPLACE FUNCTION find_celebrity_matches(
    query_embedding vector(512),
    match_count int DEFAULT 10,
    gender_filter text DEFAULT NULL,
    category_filter text DEFAULT NULL
)
RETURNS TABLE (
    celebrity_id uuid,
    celebrity_name text,
    similarity float,
    image_path text,
    bio text,
    category text,
    gender text
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.image_path,
    c.bio,
    c.category,
    c.gender
  FROM celebrities c
  WHERE c.embedding IS NOT NULL
    AND (gender_filter IS NULL OR c.gender = gender_filter)
    AND (category_filter IS NULL OR c.category = category_filter)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function comment
COMMENT ON FUNCTION find_celebrity_matches IS
  'Find celebrity lookalikes using vector similarity search. Returns top N matches with similarity scores.';

-- Create a simpler function for quick top matches without filters
CREATE OR REPLACE FUNCTION find_top_celebrity_matches(
    query_embedding vector(512),
    match_count int DEFAULT 10
)
RETURNS TABLE (
    celebrity_id uuid,
    celebrity_name text,
    similarity float,
    image_path text
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.image_path
  FROM celebrities c
  WHERE c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_top_celebrity_matches IS
  'Simplified celebrity lookalike search returning only essential fields for better performance';

-- Verification query
DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'find_celebrity_matches'
  ) INTO func_exists;

  RAISE NOTICE 'Migration 014 completed: celebrity vector search functions updated';
  RAISE NOTICE 'find_celebrity_matches exists: %', func_exists;
  RAISE NOTICE 'Functions now query celebrities table directly (not profiles/faces)';
END $$;
