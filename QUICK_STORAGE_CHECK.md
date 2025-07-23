# Quick Storage Check - 3 Steps

## Step 1: Test Storage Access

Run this in your browser console while on your app:

```javascript
fetch('/api/test-storage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
.then(r => r.json())
.then(data => {
  console.log('Storage test result:', data);
  if (data.success) {
    console.log('✅ Storage is working!');
    console.log('Public URL:', data.publicUrl);
  } else {
    console.error('❌ Storage error:', data.error);
  }
});
```

## Step 2: Check What Happens When You Generate an Image

1. Open browser console (F12)
2. Go to a recipe page or create a new one
3. Click "Generate Image"
4. Look for these logs:
   - ✅ "DALL-E image generated: ..."
   - ✅ "Attempting to download image from: ..."
   - ✅ "Downloaded image: X bytes"
   - ✅ "Uploading to Supabase: ..."
   - ✅ "Image stored successfully at: ..."

If you see ❌ errors instead, note which step failed.

## Step 3: Check Network Tab

1. Open Network tab (F12 → Network)
2. Generate an image
3. Find `/api/recipes/generate-image` request
4. Check Response tab:

**Good Response:**
```json
{
  "imageUrl": "https://[project].supabase.co/storage/v1/object/public/recipe-images/...",
  "isStored": true
}
```

**Bad Response:**
```json
{
  "imageUrl": "https://oaidalleapi...",
  "isStored": false,
  "storageError": "Error message here"
}
```

## If Storage Test Fails:

**Error: "Bucket not found"**
→ Create bucket: Storage → New Bucket → Name: `recipe-images`, Public: ✅

**Error: "Policy violation"**
→ Run the SQL in `fix_recipe_images_storage.sql`

**Error: "Invalid JWT"**
→ Check your environment variables in Vercel

## The CORS Error

The CORS error you're seeing is because:
- The image URL is still a DALL-E URL (not Supabase)
- DALL-E URLs have CORS restrictions
- They expire after 2 hours

Once images are stored in Supabase, no more CORS errors! 