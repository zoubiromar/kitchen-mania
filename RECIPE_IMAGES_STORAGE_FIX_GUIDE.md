# Recipe Images Storage Fix Guide

## Problem
Images are not being saved to the `recipe-images` bucket due to RLS (Row Level Security) policy violations.

Error: `"new row violates row-level security policy"`

## Root Cause
The API routes run server-side and use the Supabase service role or anon key, not an authenticated user's token. The current RLS policies only allow authenticated users, blocking server-side uploads.

## Solutions (Try in Order)

### Solution 1: Update MIME Types (Already Done)
The test storage now uses PNG instead of text files to match bucket restrictions.

### Solution 2: Fix RLS Policies for Service Role
Run `RECIPE_IMAGES_RLS_SERVICE_ROLE.sql` in Supabase SQL Editor:
- Allows both authenticated users AND anon role
- Maintains security while allowing API uploads

### Solution 3: Comprehensive RLS Reset
Run `FIX_RECIPE_IMAGES_RLS.sql` in Supabase SQL Editor:
- Drops all conflicting policies
- Creates fresh policies for authenticated users
- Sets proper public read access

### Solution 4: Temporary RLS Disable (Testing Only)
Run `DISABLE_RLS_RECIPE_IMAGES.sql` in Supabase SQL Editor:
- **WARNING**: Makes bucket completely open
- Use only to verify RLS is the issue
- Re-enable proper policies after testing

### Solution 5: Copy Avatar Bucket Settings
Since avatar uploads work:
1. Go to Supabase Dashboard → Storage
2. Click on `avatars` bucket → Policies
3. Note all policies and their exact settings
4. Apply identical policies to `recipe-images` bucket

### Solution 6: Use Supabase Service Role in API
Ensure your API routes use the service role key:
```typescript
// In your API route or server-side code
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role, not anon key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

## Testing After Each Solution
1. Go to `/test-image-storage`
2. Click "Test Storage Access" 
3. Click "Generate Test Image"
4. Check if images appear in Supabase Dashboard → Storage → recipe-images

## Verification
Once working, you should see:
- ✅ Test storage shows "success: true"
- ✅ Generated images show "isStored: true"
- ✅ Images visible in Supabase Storage dashboard
- ✅ No more CORS errors from expired DALL-E URLs

## Common Issues
1. **Bucket doesn't exist**: Create it in Supabase Dashboard
2. **MIME type error**: Bucket restricted to image types only
3. **403 Unauthorized**: RLS policies blocking access
4. **Service role not working**: Check environment variables

## Environment Variables Check
Ensure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (if using service role) 