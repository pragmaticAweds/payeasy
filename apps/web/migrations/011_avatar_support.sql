-- Avatar URL field migration for PayEasy users table
-- This migration adds support for user avatars stored in Supabase Storage

-- ============================================================================
-- Migration: Add avatar_url field to users table
-- ============================================================================

-- 1. Add avatar_url column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Add comment for documentation
COMMENT ON COLUMN users.avatar_url IS 'Public URL to user avatar image stored in Supabase Storage bucket ''avatars''';

-- 3. Create an index on avatar_url for queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url);

-- ============================================================================
-- Supabase Storage Setup
-- ============================================================================

-- These commands should be run in the Supabase SQL Editor or Dashboard

-- 1. Create the avatars bucket (if not already created)
-- Note: Replace with actual Supabase bucket creation method if needed
-- Using Supabase Dashboard:
-- - Go to Storage -> Buckets
-- - Create new bucket called "avatars"
-- - Set to Public (or configure RLS policies)
-- - Set max file size to 5,242,880 bytes (5MB)
-- - Allow MIME types: image/jpeg, image/png

-- 2. Row Level Security (RLS) Policies for avatars bucket

-- Policy: Users can upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);

-- Policy: Anyone can view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);

-- ============================================================================
-- Cleanup and Maintenance
-- ============================================================================

-- To delete a user's avatars when user is deleted:
-- This can be done via a trigger or manually

-- Manual cleanup function (optional)
CREATE OR REPLACE FUNCTION cleanup_user_avatars()
RETURNS TRIGGER AS $$ BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'avatars'
  AND owner_id = OLD.id;
  RETURN OLD;
END; $$ LANGUAGE plpgsql;

-- Optional: Create trigger to auto-cleanup avatars when user is deleted
-- (Uncomment if you want automatic cleanup)
-- CREATE TRIGGER cleanup_avatars_on_user_delete
-- BEFORE DELETE ON users
-- FOR EACH ROW
-- EXECUTE FUNCTION cleanup_user_avatars();

-- ============================================================================
-- Data Migration (if upgrading existing users)
-- ============================================================================

-- If you already have user records without avatar URLs, you can:

-- 1. Set default avatars
UPDATE users
SET avatar_url = NULL
WHERE avatar_url IS NULL;

-- 2. Or set a default avatar image
-- UPDATE users
-- SET avatar_url = 'https://your-default-avatar-url.jpg'
-- WHERE avatar_url IS NULL;

-- 3. Or generate placeholder avatars (e.g., with initials)
-- This would require a function, example:
-- UPDATE users
-- SET avatar_url = CONCAT(
--   'https://api.dicebear.com/7.x/initials/svg?seed=',
--   URLENCODE(username)
-- )
-- WHERE avatar_url IS NULL;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if avatar_url column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'avatar_url';

-- Check how many users have avatars
SELECT COUNT(*) as users_with_avatars
FROM users
WHERE avatar_url IS NOT NULL;

-- Check storage buckets
SELECT name, created_at
FROM storage.buckets
WHERE name = 'avatars';

-- View all storage policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%avatar%';

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- Remove avatar_url column
-- ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;

-- Remove storage policies
-- DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;

-- Remove cleanup function
-- DROP FUNCTION IF EXISTS cleanup_user_avatars();
