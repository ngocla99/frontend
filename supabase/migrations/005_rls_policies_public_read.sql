-- RLS Policies for Public Read Access to Live Match Feed
-- This migration allows unauthenticated and authenticated users to read
-- profiles and faces data for displaying the public live match feed

-- ========================================
-- 1. Enable RLS on tables (if not already enabled)
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. PROFILES TABLE - Public Read Policies
-- ========================================

-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Allow anyone (authenticated or not) to read ALL profiles
-- This is needed for the public live match feed
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO public
USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ========================================
-- 3. FACES TABLE - Public Read Policies
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public faces are viewable by everyone" ON faces;
DROP POLICY IF EXISTS "Users can view all faces" ON faces;
DROP POLICY IF EXISTS "Users can insert own faces" ON faces;
DROP POLICY IF EXISTS "Users can update own faces" ON faces;
DROP POLICY IF EXISTS "Users can delete own faces" ON faces;

-- Allow anyone (authenticated or not) to read ALL faces
-- This is needed for the public live match feed to show face images
CREATE POLICY "Public faces are viewable by everyone"
ON faces FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert their own faces
CREATE POLICY "Users can insert own faces"
ON faces FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Allow authenticated users to update their own faces
CREATE POLICY "Users can update own faces"
ON faces FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Allow authenticated users to delete their own faces
CREATE POLICY "Users can delete own faces"
ON faces FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);

-- ========================================
-- 4. MATCHES TABLE - Public Read Policies
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public matches are viewable by everyone" ON matches;
DROP POLICY IF EXISTS "Users can view all matches" ON matches;

-- Allow anyone (authenticated or not) to read ALL matches
-- This is needed for the public live match feed
CREATE POLICY "Public matches are viewable by everyone"
ON matches FOR SELECT
TO public
USING (true);

-- ========================================
-- 5. VERIFICATION
-- ========================================

-- Check that all policies were created successfully
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'faces', 'matches')
ORDER BY tablename, policyname;

-- Verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'faces', 'matches');

-- Expected results:
-- profiles: 3 policies (SELECT for public, UPDATE/INSERT for authenticated)
-- faces: 4 policies (SELECT for public, INSERT/UPDATE/DELETE for authenticated)
-- matches: 1 policy (SELECT for public)
