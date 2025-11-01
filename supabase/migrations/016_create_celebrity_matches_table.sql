-- Migration 016: Create Celebrity Matches Table
-- Description: Separate celebrity matches from user matches into dedicated table
-- Author: Claude Code
-- Date: 2025-11-01
-- Reason: Avoid NULL constraint violations and simplify schema

-- Step 1: Create new celebrity_matches table
CREATE TABLE IF NOT EXISTS celebrity_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  face_id UUID NOT NULL REFERENCES faces(id) ON DELETE CASCADE,
  celebrity_id UUID NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
  similarity_score FLOAT NOT NULL CHECK (similarity_score >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one celebrity match per face-celebrity pair
  CONSTRAINT unique_face_celebrity UNIQUE (face_id, celebrity_id)
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_celebrity_matches_face_id
  ON celebrity_matches(face_id);

CREATE INDEX IF NOT EXISTS idx_celebrity_matches_celebrity_id
  ON celebrity_matches(celebrity_id);

CREATE INDEX IF NOT EXISTS idx_celebrity_matches_similarity
  ON celebrity_matches(face_id, similarity_score DESC);

CREATE INDEX IF NOT EXISTS idx_celebrity_matches_created_at
  ON celebrity_matches(created_at DESC);

-- Step 3: Add updated_at trigger
CREATE OR REPLACE FUNCTION update_celebrity_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_celebrity_matches_updated_at
  BEFORE UPDATE ON celebrity_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_celebrity_matches_updated_at();

-- Step 4: Migrate existing celebrity matches (if any exist)
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Copy celebrity matches to new table
  INSERT INTO celebrity_matches (face_id, celebrity_id, similarity_score, created_at)
  SELECT face_a_id, celebrity_id, similarity_score, created_at
  FROM matches
  WHERE match_type = 'user_to_celebrity' AND celebrity_id IS NOT NULL
  ON CONFLICT (face_id, celebrity_id) DO NOTHING;

  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % celebrity matches to new table', migrated_count;

  -- Delete celebrity matches from old table
  DELETE FROM matches WHERE match_type = 'user_to_celebrity';

  RAISE NOTICE 'Deleted celebrity matches from old matches table';
END $$;

-- Step 5: Clean up matches table - remove celebrity-related columns
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_celebrity_structure_check;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_match_type_check;
DROP INDEX IF EXISTS idx_matches_celebrity_id;
DROP INDEX IF EXISTS idx_matches_face_celebrity;
DROP INDEX IF EXISTS unique_user_to_celebrity_match;

ALTER TABLE matches DROP COLUMN IF EXISTS celebrity_id;
ALTER TABLE matches DROP COLUMN IF EXISTS match_type;

-- Step 6: Ensure face_b_id is NOT NULL (only user-to-user matches remain)
-- First, delete any malformed records
DELETE FROM matches WHERE face_b_id IS NULL;

-- Then enforce NOT NULL constraint
ALTER TABLE matches ALTER COLUMN face_b_id SET NOT NULL;

-- Step 7: Add RLS policies for celebrity_matches
ALTER TABLE celebrity_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own celebrity matches
DROP POLICY IF EXISTS "Users can view their own celebrity matches" ON celebrity_matches;
CREATE POLICY "Users can view their own celebrity matches"
  ON celebrity_matches
  FOR SELECT
  USING (
    face_id IN (
      SELECT f.id FROM faces f
      WHERE f.profile_id = auth.uid()
    )
  );

-- Policy: Service role can insert celebrity matches (for Edge Functions)
DROP POLICY IF EXISTS "Service role can insert celebrity matches" ON celebrity_matches;
CREATE POLICY "Service role can insert celebrity matches"
  ON celebrity_matches
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update celebrity matches
DROP POLICY IF EXISTS "Service role can update celebrity matches" ON celebrity_matches;
CREATE POLICY "Service role can update celebrity matches"
  ON celebrity_matches
  FOR UPDATE
  USING (true);

-- Step 8: Add comments for documentation
COMMENT ON TABLE celebrity_matches IS 'Stores user-to-celebrity face match results from vector similarity search';
COMMENT ON COLUMN celebrity_matches.face_id IS 'Reference to user face that was matched';
COMMENT ON COLUMN celebrity_matches.celebrity_id IS 'Reference to celebrity that was matched';
COMMENT ON COLUMN celebrity_matches.similarity_score IS 'Cosine similarity score (0-1, higher is more similar)';

-- Step 9: Verification
DO $$
DECLARE
  table_exists BOOLEAN;
  celeb_matches_count INTEGER;
  user_matches_count INTEGER;
BEGIN
  -- Check if celebrity_matches table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'celebrity_matches'
  ) INTO table_exists;

  -- Count records
  SELECT COUNT(*) INTO celeb_matches_count FROM celebrity_matches;
  SELECT COUNT(*) INTO user_matches_count FROM matches;

  RAISE NOTICE '=== Migration 016 Completed ===';
  RAISE NOTICE 'celebrity_matches table exists: %', table_exists;
  RAISE NOTICE 'Celebrity matches count: %', celeb_matches_count;
  RAISE NOTICE 'User matches count: %', user_matches_count;
  RAISE NOTICE 'Total indexes on celebrity_matches: %', (
    SELECT count(*) FROM pg_indexes WHERE tablename = 'celebrity_matches'
  );
  RAISE NOTICE 'Total indexes on matches: %', (
    SELECT count(*) FROM pg_indexes WHERE tablename = 'matches'
  );
END $$;
