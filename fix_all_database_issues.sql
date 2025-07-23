-- ========================================
-- FIX ALL DATABASE ISSUES IN ONE SCRIPT
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Add missing tags column to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 2. Create index for tags performance
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN (tags);

-- 3. Update any existing recipes with NULL tags
UPDATE recipes 
SET tags = '{}' 
WHERE tags IS NULL;

-- 4. Create recipe-images bucket if it doesn't exist
-- Note: This needs to be done via Supabase UI, but here are the storage policies

-- 5. Enable RLS on storage objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Recipe images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete recipe images" ON storage.objects;

-- 7. Create storage policies for recipe-images bucket
CREATE POLICY "Users can upload recipe images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Recipe images are publicly accessible" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'recipe-images');

CREATE POLICY "Users can update recipe images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'recipe-images')
WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Users can delete recipe images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'recipe-images');

-- ========================================
-- IMPORTANT: After running this script:
-- 1. Go to Settings → API → Reload Schema Cache
-- 2. Create 'recipe-images' bucket in Storage if it doesn't exist
-- 3. Clear your browser cache
-- ======================================== 