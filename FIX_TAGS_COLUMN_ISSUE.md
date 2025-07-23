# Fix for Missing Tags Column in Supabase

## Problem
After adding tags functionality to the application, the Supabase database is missing the `tags` column in the `recipes` table, causing:
- Recipe save operations to fail with 400 errors
- "Could not find the 'tags' column of 'recipes' in the schema cache" error

## Solution

### Step 1: Add the Tags Column to Your Supabase Database

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to the **SQL Editor** (in the left sidebar)
4. Create a new query and paste the following SQL:

```sql
-- Add tags column to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create an index for better performance when filtering by tags
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN (tags);

-- Update existing recipes to have empty tags array if NULL
UPDATE recipes 
SET tags = '{}' 
WHERE tags IS NULL;
```

5. Click **Run** to execute the migration

### Step 2: Clear Supabase Cache (Important!)

After adding the column, you need to refresh the PostgREST schema cache:

1. In Supabase Dashboard, go to **Settings** → **API**
2. Under "PostgREST", click **Reload Schema Cache**
3. Wait a few seconds for the cache to refresh

### Alternative Method: Using Table Editor

If you prefer using the UI:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `recipes` table
3. Click **Add column**
4. Configure:
   - Name: `tags`
   - Type: `text[]`
   - Default value: `{}`
   - Is Nullable: Yes (or No with default)
5. Save the column

### Step 3: Verify the Fix

1. Go to your application
2. Try saving a recipe - it should work now
3. Try editing a recipe and saving - it should work
4. Tags should persist when added to recipes

## Why This Happened

When we added tags functionality:
1. ✅ We updated TypeScript types to include `tags`
2. ✅ We updated all code to send `tags` with recipe data
3. ❌ But we didn't update the actual database schema

This is a common issue when adding new fields - the code expects the field but the database doesn't have it yet.

## Prevention for Future

When adding new fields to database tables:
1. First create and run the database migration
2. Then update the TypeScript types
3. Finally update the application code

This ensures the database is ready before the code tries to use new fields. 