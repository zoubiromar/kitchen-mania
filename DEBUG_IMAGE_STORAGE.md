# Debug Recipe Image Storage Issues

## The Problem
Images are still using DALL-E URLs instead of Supabase storage URLs, causing:
- CORS errors
- Images expiring after 2 hours
- 403 errors when URLs expire

## Quick Checks

### 1. Check Browser Console During Image Generation
When you generate an image, you should see these logs:
```
DALL-E image generated: https://oai-dalle...
Attempting to download image from: https://oai-dalle...
Downloaded image: 245632 bytes, type: image/png
Uploading to Supabase: chicken_salad_1737607899123.png
Image stored successfully at: https://[project].supabase.co/storage/v1/object/public/recipe-images/...
```

**If you see an error instead:**
- "Storage bucket 'recipe-images' not found" → Bucket doesn't exist
- "Policy violation" → Missing permissions
- "Failed to download image" → DALL-E issue

### 2. Check Supabase Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click on `recipe-images` bucket
3. Check:
   - Is it marked as **Public**?
   - Are there any images in it?
   - Can you manually upload a test image?

### 3. Verify All Policies Exist

Run this SQL to check:
```sql
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%recipe%'
ORDER BY policyname;
```

You should see 4 policies:
- Allow authenticated users to upload recipe images (INSERT)
- Allow public read access to recipe images (SELECT)
- Allow users to delete recipe images (DELETE)
- Users can update recipe images (UPDATE)

### 4. Check API Response

In the browser Network tab when generating an image:
1. Find the `/api/recipes/generate-image` request
2. Check the response - it should have:
   ```json
   {
     "imageUrl": "https://[project].supabase.co/storage/v1/object/public/recipe-images/...",
     "isStored": true
   }
   ```

If `isStored` is false, check `storageError` field.

## Manual Test

Try this in your browser console while on the app:
```javascript
// Test if bucket exists and is accessible
fetch('/api/test-storage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Common Fixes

### If Bucket Doesn't Exist:
1. Storage → New Bucket
2. Name: `recipe-images`
3. Public: ✅ Yes
4. Save

### If Policies Are Missing:
Run this complete SQL:
```sql
-- Drop all existing recipe policies
DROP POLICY IF EXISTS "Allow authenticated users to upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete recipe images" ON storage.objects;

-- Recreate all policies
CREATE POLICY "Allow authenticated users to upload recipe images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Allow public read access to recipe images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'recipe-images');

CREATE POLICY "Users can update recipe images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'recipe-images')
WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Allow users to delete recipe images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'recipe-images');
```

### If Still Not Working:

1. **Check Vercel Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` must be set
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set
   - `OPENAI_API_KEY` must be set

2. **Clear and Reload:**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Hard refresh (Ctrl+F5)
   - Try in incognito mode

3. **Check Supabase Logs:**
   - Dashboard → Logs → API logs
   - Filter by "storage"
   - Look for any errors

## What Should Happen

1. User generates image → DALL-E creates temporary URL
2. Our API downloads that image immediately
3. Uploads to Supabase storage
4. Returns Supabase URL to frontend
5. Frontend saves Supabase URL to database
6. Image loads from Supabase forever (no expiry) 