# KitchenMania

A pantry and recipe webapp that knows what's in your kitchen. Snap a receipt, get your groceries logged automatically, then ask the app what to cook with what you have.

## Demo

Live: [kitchen-mania.vercel.app](https://kitchen-mania.vercel.app)

## Features

- Pantry tracking with quantities, expiration dates, and auto-assigned emojis
- Receipt scanning (GPT-4o vision) that extracts items, prices, and merchant
- Bulk text parsing for quick item entry
- AI recipe generation from whatever's currently in your pantry
- Recipe image generation via DALL-E, stored permanently in Supabase
- Price history per item per merchant
- Imperial / metric unit toggle
- Per-user accounts with cloud sync (Supabase Auth + Postgres)

## Tech stack

- Next.js 15.4 (App Router) + React 19 + TypeScript
- Tailwind CSS v4, shadcn/ui, Radix primitives
- Supabase (Postgres, Auth, Storage)
- OpenAI API: GPT-3.5-turbo (text), GPT-4o (vision), DALL-E (images)
- Deployed on Vercel

## Getting started

Requirements: Node 18+, a Supabase project, and (optional) an OpenAI API key.

1. Clone and install:
   ```bash
   git clone https://github.com/zoubiromar/kitchen-mania.git
   cd kitchen-mania
   npm install
   ```

2. Create `.env.local` in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   OPENAI_API_KEY=your_openai_key
   ```

   Without `OPENAI_API_KEY`, manual entry and price tracking still work. AI features fall back to mock data.

3. Set up the database. In the Supabase SQL editor, run:
   - `supabase-schema.sql` (tables: `profiles`, `pantry_items`, `recipes`, `price_tracker_items`, plus RLS policies)
   - `supabase_storage_setup.sql` (creates the `recipe-images` storage bucket and its policies)

4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Deploying

Push to a GitHub repo, import it on Vercel, and set the same four env vars in the Vercel project settings. The included `vercel.json` already raises the function timeout to 30s for the receipt-parse, recipe-recommend, and image-generation routes.

In your Supabase project's Auth settings, set:
- Site URL: your production URL
- Redirect URLs: include `<your-url>/auth/confirm` so email confirmation lands on the right page

## Project structure

```
src/
  app/
    api/         # API routes (OpenAI calls, receipt parsing, image generation)
    pantry/      # Pantry page
    recipes/     # Recipe pages
    tracker/     # Price tracker
  components/    # UI components
  lib/           # Supabase client, database helpers, image storage utils
  utils/         # Misc helpers
```

## Why I built this

I wanted a single project that exercised the full stack I keep reaching for at work: vision and LLM calls behind clean API routes, a real auth-gated database, image storage that doesn't break when DALL-E URLs expire, and a UI that doesn't feel like a CRUD app. KitchenMania is also genuinely useful: I run out of groceries less now, and "what can I make tonight" is a one-tap question instead of a fridge-staring contest.

## License

MIT. See `LICENSE`.
