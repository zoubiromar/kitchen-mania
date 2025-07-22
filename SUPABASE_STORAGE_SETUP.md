# Supabase Storage Setup Guide

## Avatar Storage Configuration

### 1. Create the Avatars Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New Bucket**
4. Name it: `avatars`
5. Set **Public bucket**: ON (toggle enabled)
6. Click **Create bucket**

### 2. Configure Storage Policies

You need to configure policies at the bucket level, not at the storage.objects level.

#### In the Storage section:

1. Click on the `avatars` bucket
2. Click on **Policies** tab
3. Create the following policies:

**Policy 1: Public Read Access**
- Name: `Avatar images are publicly accessible`
- Allowed operation: `SELECT`
- Target roles: Leave empty (public access)
- Policy definition:
  ```sql
  true
  ```

**Policy 2: Authenticated Users Can Upload**
- Name: `Users can upload their own avatar`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition:
  ```sql
  (auth.uid() = (storage.foldername(name))[1]::uuid)
  ```
  
  Or if that doesn't work, use:
  ```sql
  auth.uid() IS NOT NULL
  ```

**Policy 3: Users Can Update Their Own Avatar**
- Name: `Users can update their own avatar`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- Policy definition:
  ```sql
  (auth.uid() = (storage.foldername(name))[1]::uuid)
  ```
  
  Or simpler:
  ```sql
  auth.uid() IS NOT NULL
  ```

**Policy 4: Users Can Delete Their Own Avatar**
- Name: `Users can delete their own avatar`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- Policy definition:
  ```sql
  (auth.uid() = (storage.foldername(name))[1]::uuid)
  ```

### 3. Test Your Configuration

1. Try uploading a small image file (< 1MB)
2. Check the browser console for detailed error messages
3. Verify the file appears in Storage → avatars bucket

### Common Issues

1. **400 Bad Request**: Usually means the bucket doesn't exist or file is too large
2. **Policy violation**: The policy SQL might need adjustment based on your file naming
3. **File size**: Supabase has a default 50MB limit, but your plan may differ

### File Naming Convention

Our app uses this naming pattern:
```
{userId}-{timestamp}.{extension}
```

Example: `6830b886-b878-4d22-bcf4-dad1557a7370-1753209174235.jpg` 