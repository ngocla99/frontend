-- Storage Policies for Public Read Access to Face Images
-- This migration allows public read access to the 'user-images' storage bucket

-- ========================================
-- 1. Update 'user-images' bucket to be public
-- ========================================

-- Update the user-images bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'user-images';

-- ========================================
-- 2. Storage Policies for 'user-images' bucket
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view all face images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload face images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own face images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own face images" ON storage.objects;

-- Allow anyone to read face images (public access for live match feed)
CREATE POLICY "Public can view all face images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-images');

-- Allow authenticated users to upload face images
CREATE POLICY "Authenticated users can upload face images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-images');

-- Allow authenticated users to update their own face images
-- Images are stored in folders named after user emails or 'celeb' for celebrities
CREATE POLICY "Users can update their own face images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-images' AND
  (
    -- User can update their own images (path starts with their email)
    (storage.foldername(name))[1] = auth.jwt()->>'email'
  )
)
WITH CHECK (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = auth.jwt()->>'email'
);

-- Allow authenticated users to delete their own face images
CREATE POLICY "Users can delete their own face images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = auth.jwt()->>'email'
);

-- ========================================
-- 3. VERIFICATION
-- ========================================

-- Check bucket configuration
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'user-images';

-- Check storage policies
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%face%'
ORDER BY policyname;

-- Expected results:
-- - Bucket 'user-images' exists with public = true
-- - 4 policies created: SELECT (public), INSERT/UPDATE/DELETE (authenticated)
