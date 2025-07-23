# Fix Database Using Supabase Management API

Since the SQL editor has permission issues, let's use the Management API approach.

## Option 1: Direct REST API Call

You can run this in your browser console or with curl:

```javascript
// Run this in your browser console while on any page
fetch('https://cabsqddxrinmezpnsjlh.supabase.co/rest/v1/rpc', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'YOUR_SERVICE_ROLE_KEY',
    'Authorization': 'Bearer YOUR_SERVICE_ROLE_KEY'
  },
  body: JSON.stringify({
    query: "ALTER TABLE recipes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'"
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

## Option 2: Using Supabase Dashboard (Simplest)

Since you're having permission issues with SQL, the **Table Editor is your best bet**:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Table Editor**
3. Select `recipes` table
4. Click **Add column**
5. Configure:
   - Name: `tags`
   - Type: `text[]`
   - Default: `'{}'`
   - Nullable: Yes
6. Click **Save**

## Option 3: Alternative Approach - Modify Schema File

If you have access to your initial schema:

1. Find your `supabase-schema.sql` file
2. Add this line to the recipes table definition:
   ```sql
   tags text[] DEFAULT '{}',
   ```
3. Re-run your schema setup

## Why This Is Happening

- Supabase doesn't give users superuser permissions
- The `storage.objects` table requires superuser access
- The tags column wasn't in the original schema

## Quick Test

After adding the column, test if it worked:

```sql
-- Run this in SQL Editor to verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recipes' 
AND column_name = 'tags';
```

Should return one row showing the tags column exists. 