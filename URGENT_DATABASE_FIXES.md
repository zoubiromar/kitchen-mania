# 🚨 URGENT: Database Schema Fixes Required

Your application is experiencing errors because the database schema is out of sync with the code. You need to apply these fixes immediately.

## Issue 1: Missing 'tags' Column ❌

**Error:** `"Could not find the 'tags' column of 'recipes' in the schema cache"`

### Quick Fix:

1. Go to [Supabase Dashboard](https://app.supabase.com) → **SQL Editor**
2. Run this SQL:

```sql
-- Add tags column to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN (tags);
```

3. Go to **Settings** → **API** → Click **Reload Schema Cache** under PostgREST
4. Wait 30 seconds, then test saving a recipe

## Issue 2: Recipe Images Not Persisting 🖼️

**Error:** DALL-E URLs expiring (403 errors)

### Quick Fix:

1. Check if `recipe-images` bucket exists in Supabase Storage:
   - Go to **Storage** in Supabase Dashboard
   - If no `recipe-images` bucket exists, create it:
     - Click **New bucket**
     - Name: `recipe-images`
     - Public bucket: ✅ Yes
     - Click **Create**

2. If bucket exists but images still fail, run this SQL to set proper permissions:

```sql
-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload recipe images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

-- Allow public to view images
CREATE POLICY "Recipe images are publicly accessible" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'recipe-images');

-- Allow users to update their images
CREATE POLICY "Users can update recipe images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'recipe-images')
WITH CHECK (bucket_id = 'recipe-images');

-- Allow users to delete their images
CREATE POLICY "Users can delete recipe images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'recipe-images');
```

## Verification Steps

### Test Recipe Saving:
1. Go to "My Pantry"
2. Click "Save Recipe"
3. Recipe should save without errors

### Test Image Generation:
1. Create or edit a recipe
2. Click "Generate Image"
3. Image should appear and persist after page refresh

## Still Having Issues?

If errors persist after these fixes:

1. **Clear your browser cache** (Ctrl+Shift+Delete)
2. **Check Supabase logs**: Dashboard → **Logs** → **API logs**
3. **Verify environment variables** in your deployment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`

## Why This Happened

The application code was updated to include new features (tags and permanent image storage) but the database schema wasn't updated to match. This is a common deployment issue when database migrations aren't automatically applied.

## Prevention

For future updates:
1. Always check for required database migrations
2. Apply migrations before deploying new code
3. Test in a staging environment first 