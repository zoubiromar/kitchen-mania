-- Fix recipe-images storage by adding missing UPDATE policy
-- Run this in Supabase SQL Editor

-- Add UPDATE policy for recipe images (similar to avatar bucket)
CREATE POLICY "Users can update recipe images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'recipe-images')
WITH CHECK (bucket_id = 'recipe-images');

-- Verify all policies are in place
SELECT 
    pol.policyname,
    pol.permissive,
    pol.cmd,
    pol.qual,
    pol.with_check
FROM pg_policies pol
WHERE pol.tablename = 'objects'
AND pol.schemaname = 'storage'
AND pol.policyname LIKE '%recipe%'
ORDER BY pol.policyname; 