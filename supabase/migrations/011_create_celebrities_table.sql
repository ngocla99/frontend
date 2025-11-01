-- Migration 011: Create Celebrities Table
-- Description: Create a dedicated celebrities table with embedded face data (no reference to faces table)
-- Author: Claude Code
-- Date: 2025-11-01

-- Create celebrities table with embedded face data
CREATE TABLE IF NOT EXISTS celebrities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  category TEXT, -- 'actor', 'musician', 'athlete', 'influencer', etc.
  gender TEXT CHECK (gender IN ('male', 'female')),
  image_path TEXT NOT NULL, -- Stored in celebrity-images bucket
  embedding vector(512), -- InsightFace embedding stored directly in this table
  image_hash TEXT UNIQUE, -- Prevent duplicate celebrity images
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector index for similarity search (IVFFlat for better performance)
-- Using cosine distance for face similarity
CREATE INDEX IF NOT EXISTS idx_celebrities_embedding ON celebrities
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_celebrities_category ON celebrities(category);
CREATE INDEX IF NOT EXISTS idx_celebrities_gender ON celebrities(gender);
CREATE INDEX IF NOT EXISTS idx_celebrities_image_hash ON celebrities(image_hash);
CREATE INDEX IF NOT EXISTS idx_celebrities_created_at ON celebrities(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE celebrities IS 'Celebrity profiles with embedded face data for lookalike matching';
COMMENT ON COLUMN celebrities.id IS 'Unique identifier for celebrity';
COMMENT ON COLUMN celebrities.name IS 'Celebrity full name';
COMMENT ON COLUMN celebrities.bio IS 'Short biography or description';
COMMENT ON COLUMN celebrities.category IS 'Celebrity category: actor, musician, athlete, influencer';
COMMENT ON COLUMN celebrities.gender IS 'Gender for filtering matches';
COMMENT ON COLUMN celebrities.image_path IS 'Storage path in celebrity-images bucket';
COMMENT ON COLUMN celebrities.embedding IS '512-dimensional InsightFace embedding vector for similarity search';
COMMENT ON COLUMN celebrities.image_hash IS 'MD5 hash of image for deduplication';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_celebrities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER celebrities_updated_at_trigger
  BEFORE UPDATE ON celebrities
  FOR EACH ROW
  EXECUTE FUNCTION update_celebrities_updated_at();

-- Verification query
DO $$
BEGIN
  RAISE NOTICE 'Migration 011 completed: celebrities table created';
  RAISE NOTICE 'Table has % columns', (SELECT count(*) FROM information_schema.columns WHERE table_name = 'celebrities');
  RAISE NOTICE 'Indexes created: % indexes', (SELECT count(*) FROM pg_indexes WHERE tablename = 'celebrities');
END $$;
