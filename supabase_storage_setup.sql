-- Supabase Storage Setup for Recipe Images
-- Run these commands in your Supabase SQL Editor

-- 1. Create the recipe-images bucket (if not done via UI)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 2. Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload recipe images" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'recipe-images'
  );

-- 3. Allow users to view all recipe images (public read)
CREATE POLICY "Allow public read access to recipe images" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');

-- 4. Allow users to delete their own uploaded images
CREATE POLICY "Allow users to delete recipe images" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'recipe-images'
  );

-- 5. Allow users to update their own uploaded images  
CREATE POLICY "Allow users to update recipe images" ON storage.objects
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'recipe-images'
  );

-- Note: If you want to restrict users to only delete images they uploaded,
-- you would need to add user_id tracking. For simplicity, this allows
-- any authenticated user to delete any recipe image. 