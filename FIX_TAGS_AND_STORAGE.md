# Fix Tags Display and Recipe Image Storage

## Issue 1: Tags Not Showing in Collection ✅ FIXED

**Problem**: Tags were being overwritten with an empty array when loading recipes.

**Fix Applied**: Changed line 58 in `src/app/recipes/page.tsx`:
```typescript
// Before: tags: []
// After:  tags: recipe.tags || []
```

Now tags will:
- Display in the recipe collection between stars and serving info
- Show up in the "All Tags" dropdown filter
- Properly filter recipes when selected

## Issue 2: Recipe Images Not Saving to Bucket

**Problem**: Missing UPDATE policy on the recipe-images bucket (avatars have it, recipe-images don't).

**Fix**: Run this SQL in Supabase Dashboard:

```sql
-- Add missing UPDATE policy
CREATE POLICY "Users can update recipe images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'recipe-images')
WITH CHECK (bucket_id = 'recipe-images');
```

### Steps to Apply Storage Fix:

1. Go to [Supabase Dashboard](https://app.supabase.com) → **SQL Editor**
2. Paste the SQL above
3. Click **Run**
4. You should see "Success. No rows returned"

### Alternative: Use Table Editor

1. Go to **Database** → **Tables**
2. Find `storage.objects` table
3. Go to **RLS Policies** tab
4. You should now see 4 policies for recipe-images (INSERT, SELECT, UPDATE, DELETE)

## Testing

### Test Tags:
1. Visit your recipe collection page
2. You should now see tags on each recipe card
3. The "All Tags" dropdown should list all unique tags
4. Clicking a tag in the filter should show only recipes with that tag

### Test Image Storage:
1. Create a new recipe or edit an existing one
2. Generate an image
3. Check browser console for logs
4. Go to Supabase Storage → recipe-images bucket
5. You should see the new image file there

## Debugging Image Storage

If images still aren't saving after adding the UPDATE policy:

1. **Check Console Logs** - Our enhanced logging will show:
   - "Attempting to download image from: [DALL-E URL]"
   - "Downloaded image: X bytes, type: image/png"
   - "Uploading to Supabase: [filename]"
   - "Image stored successfully at: [Supabase URL]"

2. **Common Errors**:
   - "Storage bucket 'recipe-images' not found" - Create the bucket
   - "Policy violation" - Run the SQL above
   - "Downloaded image is empty" - DALL-E issue, try again

3. **Check Supabase Logs**:
   - Dashboard → Logs → API logs
   - Filter by "storage"
   - Look for any 403 or policy errors

## Why This Happens

- **Tags**: The frontend code was accidentally hardcoding empty tags array
- **Storage**: Supabase requires explicit policies for each operation (INSERT, SELECT, UPDATE, DELETE) 