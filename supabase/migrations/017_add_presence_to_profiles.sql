-- Migration: Add presence/last_seen tracking to profiles
-- Created: 2025-11-02
-- Description: Add last_seen column to profiles table to track when users were last online

-- Add last_seen column to profiles table
ALTER TABLE profiles
ADD COLUMN last_seen timestamptz;

-- Add index for efficient querying (used when fetching connections with last_seen)
CREATE INDEX idx_profiles_last_seen ON profiles(last_seen);

-- Add comment for documentation
COMMENT ON COLUMN profiles.last_seen IS 'Timestamp when user was last seen online (updated on disconnect)';
