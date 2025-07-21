# Setting Up Your .env.local File

## Create a file named `.env.local` in your project root with:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cabsqddxrinmezpnsjlh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYnNxZGR4cmlubWV6cG5zamxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNzExODUsImV4cCI6MjA2ODY0NzE4NX0.b-ZkVX5euE7fZq9ZrgBED-WEAMC3rT4j52GCjPZK7E0

# App URL (update this for production)
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

## After creating the file:
1. Stop your dev server (Ctrl+C)
2. Restart with `npm run dev`
3. The app should now work locally! 