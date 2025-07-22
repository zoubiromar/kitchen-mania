# Supabase Storage Setup for Recipe Images

This guide will help you set up permanent image storage for recipe images using Supabase Storage.

## 🎯 What This Fixes

- **Problem**: DALL-E generated images expire after ~2 hours (403 errors)
- **Solution**: Download and permanently store images in Supabase Storage
- **Benefits**: Images never expire, better performance, full control

## 📋 Step-by-Step Setup

### 1. Create Storage Bucket (UI Method - Recommended)

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the sidebar
3. Click **"Create Bucket"**
4. Set the following:
   - **Name**: `recipe-images`
   - **Public**: ✅ **Enabled** (for easy image serving)
   - **File size limit**: `5 MB` (optional)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`

### 2. Set Up Storage Policies (SQL Method)

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run the SQL commands from `supabase_storage_setup.sql`:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload recipe images" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'recipe-images'
  );

-- Allow public read access to recipe images
CREATE POLICY "Allow public read access to recipe images" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');

-- Allow users to delete recipe images
CREATE POLICY "Allow users to delete recipe images" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'recipe-images'
  );
```

### 3. Verify Setup

1. Check that the `recipe-images` bucket exists in Storage
2. Test by generating a new recipe image
3. Verify the image URL looks like:
   ```
   https://your-project.supabase.co/storage/v1/object/public/recipe-images/recipe_name_123456789.png
   ```

## 🔧 What the Code Changes Do

### New Features Added:

1. **Image Storage Utilities** (`src/lib/imageStorage.ts`)
   - `downloadAndStoreImage()` - Downloads DALL-E images and stores them
   - `deleteStoredImage()` - Removes old images when updating
   - `uploadImageFile()` - For future file upload features
   - `isStoredImage()` - Checks if URL is from our storage

2. **Updated Image Generation API** (`src/app/api/recipes/generate-image/route.ts`)
   - Downloads DALL-E images immediately after generation
   - Stores them permanently in Supabase Storage
   - Returns the permanent URL instead of temporary DALL-E URL
   - Fallback to original URL if storage fails

3. **Updated Recipe Management**
   - **Edit Recipe**: Deletes old image when new one is generated
   - **Delete Recipe**: Cleans up associated image files
   - **Automatic Cleanup**: Prevents storage bloat

### Image Lifecycle:

```
DALL-E generates image → Download to server → Upload to Supabase → Store permanent URL
```

## 🚀 Usage

### For Users:
- **No change in workflow** - everything works the same
- **Images load faster** after first generation
- **No more broken images** from expired URLs

### For Developers:
```javascript
// Generate and store image
const response = await fetch('/api/recipes/generate-image', {
  method: 'POST',
  body: JSON.stringify({ title, ingredients })
});

const { imageUrl, isStored } = await response.json();
// imageUrl is now permanent!
```

## 🛡️ Security & Permissions

- **Public Read**: Anyone can view recipe images
- **Authenticated Upload**: Only logged-in users can upload
- **Authenticated Delete**: Only logged-in users can delete
- **5MB Limit**: Prevents storage abuse
- **MIME Type Restriction**: Only image files allowed

## 📊 Storage Management

### Monitor Usage:
- Go to **Settings** → **Usage** in Supabase Dashboard
- Check storage usage under "Database & Storage"
- Free tier includes 1GB storage

### Cleanup Options:
- Images are auto-deleted when recipes are updated/deleted
- For bulk cleanup, you can query `storage.objects` table
- Use the `deleteStoredImage()` utility for programmatic cleanup

## 🔍 Troubleshooting

### Common Issues:

1. **"Bucket not found" error**
   - Verify bucket name is exactly `recipe-images`
   - Check bucket exists in Supabase Dashboard

2. **"Permission denied" error**
   - Run the RLS policies SQL commands
   - Check user is authenticated

3. **Images still breaking**
   - Check `isStored` flag in API response
   - Look for storage errors in browser console
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY in .env.local

4. **Storage quota exceeded**
   - Clean up unused images
   - Upgrade Supabase plan if needed
   - Consider image compression

## ✅ Testing the Setup

1. **Generate a new recipe image**
2. **Check the URL format** - should contain `storage/v1/object/public/recipe-images/`
3. **Verify persistence** - image should still work after 2+ hours
4. **Test updates** - generating new image should replace old one
5. **Test deletion** - deleting recipe should remove image from storage

---

**🎉 Once set up, you'll have permanent, fast-loading recipe images that never expire!** 