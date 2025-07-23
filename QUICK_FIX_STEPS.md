# 🚀 Quick Fix Steps (2 minutes)

## Step 1: Fix Database Schema (1 minute)

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Click **SQL Editor** (left sidebar)
3. Click **New query**
4. Copy and paste ALL content from `fix_all_database_issues.sql` file
5. Click **RUN** button
6. You should see "Success. No rows returned"

## Step 2: Create Storage Bucket (30 seconds)

1. In Supabase, click **Storage** (left sidebar)
2. Click **New bucket**
3. Name: `recipe-images`
4. Public bucket: ✅ (check this box)
5. Click **Create bucket**

## Step 3: Clear Cache (30 seconds)

1. Go to **Settings** → **API** in Supabase
2. Click **Reload Schema Cache** button
3. Wait 10 seconds
4. In your browser: Press `Ctrl+F5` (hard refresh)

## ✅ Done! Test it:

1. Try saving a recipe - should work!
2. Try generating an image - should persist!
3. Try adding tags - should save!

---

**Still broken?** Check:
- Did you run the ENTIRE SQL script?
- Did you create the `recipe-images` bucket?
- Did you reload the schema cache?
- Try logging out and back in 