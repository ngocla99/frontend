-- Migration 013: Create Celebrity Images Storage Bucket
-- Description: Create separate storage bucket for celebrity images with public access
-- Author: Claude Code
-- Date: 2025-11-01

-- Create celebrity-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'celebrity-images',
  'celebrity-images',
  true, -- Public bucket for CDN access
  10485760, -- 10MB limit (same as user-images)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for celebrity images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload celebrity images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update celebrity images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete celebrity images" ON storage.objects;

-- Allow public read access for celebrity images (no auth required)
CREATE POLICY "Public read access for celebrity images"
ON storage.objects FOR SELECT
USING (bucket_id = 'celebrity-images');

-- Allow authenticated uploads (admin only - to be enforced at API level)
CREATE POLICY "Authenticated users can upload celebrity images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'celebrity-images');

-- Allow authenticated users to update celebrity images (admin only - to be enforced at API level)
CREATE POLICY "Authenticated users can update celebrity images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'celebrity-images')
WITH CHECK (bucket_id = 'celebrity-images');

-- Allow authenticated users to delete celebrity images (admin only - to be enforced at API level)
CREATE POLICY "Authenticated users can delete celebrity images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'celebrity-images');

-- Add comments
COMMENT ON POLICY "Public read access for celebrity images" ON storage.objects IS
  'Allow anyone to view celebrity images without authentication';

-- Verification query
DO $$
DECLARE
  bucket_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'celebrity-images'
  ) INTO bucket_exists;

  -- Count policies
  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
    AND policyname LIKE '%celebrity images%';

  RAISE NOTICE 'Migration 013 completed: celebrity-images bucket created';
  RAISE NOTICE 'Bucket exists: %', bucket_exists;
  RAISE NOTICE 'Storage policies created: %', policy_count;
END $$;
