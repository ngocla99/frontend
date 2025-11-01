-- Migration 012: Update Matches Table for Celebrities
-- Description: Add celebrity_id column and update constraints for celebrity matches
-- Author: Claude Code
-- Date: 2025-11-01

-- Add celebrity_id column to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS celebrity_id UUID REFERENCES celebrities(id) ON DELETE CASCADE;

-- Update match_type constraint to ensure valid values
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_match_type_check;
ALTER TABLE matches ADD CONSTRAINT matches_match_type_check
  CHECK (match_type IN ('user_to_user', 'user_to_celebrity'));

-- Add index for celebrity matches (filtered index for better performance)
CREATE INDEX IF NOT EXISTS idx_matches_celebrity_id ON matches(celebrity_id)
  WHERE celebrity_id IS NOT NULL;

-- Create composite index for user + celebrity lookups
CREATE INDEX IF NOT EXISTS idx_matches_face_celebrity ON matches(face_a_id, celebrity_id)
  WHERE match_type = 'user_to_celebrity';

-- Add constraint: celebrity matches should have face_b_id = NULL
-- User-to-user matches should have celebrity_id = NULL
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_celebrity_structure_check;
ALTER TABLE matches ADD CONSTRAINT matches_celebrity_structure_check
  CHECK (
    (match_type = 'user_to_user' AND celebrity_id IS NULL AND face_b_id IS NOT NULL) OR
    (match_type = 'user_to_celebrity' AND celebrity_id IS NOT NULL AND face_b_id IS NULL)
  );

-- Update unique constraint to prevent duplicate celebrity matches
-- Drop existing constraint if it exists
ALTER TABLE matches DROP CONSTRAINT IF EXISTS unique_match_pair;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_face_a_id_face_b_id_key;

-- Add new unique constraints
-- For user-to-user matches: unique pair of faces
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_to_user_match
  ON matches(LEAST(face_a_id, face_b_id), GREATEST(face_a_id, face_b_id))
  WHERE match_type = 'user_to_user' AND celebrity_id IS NULL;

-- For user-to-celebrity matches: unique user face + celebrity
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_to_celebrity_match
  ON matches(face_a_id, celebrity_id)
  WHERE match_type = 'user_to_celebrity' AND celebrity_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN matches.celebrity_id IS 'Celebrity ID for user-to-celebrity matches (face_b_id will be NULL in this case)';

-- Verification query
DO $$
DECLARE
  celeb_col_exists BOOLEAN;
  constraint_exists BOOLEAN;
BEGIN
  -- Check if celebrity_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'celebrity_id'
  ) INTO celeb_col_exists;

  -- Check if constraint exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'matches' AND constraint_name = 'matches_celebrity_structure_check'
  ) INTO constraint_exists;

  RAISE NOTICE 'Migration 012 completed: matches table updated';
  RAISE NOTICE 'celebrity_id column exists: %', celeb_col_exists;
  RAISE NOTICE 'Structure constraint exists: %', constraint_exists;
  RAISE NOTICE 'Total indexes on matches: %', (SELECT count(*) FROM pg_indexes WHERE tablename = 'matches');
END $$;
