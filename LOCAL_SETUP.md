# Local Development Setup

This guide helps you set up KitchenMania for local development.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase account (free tier is fine)

## Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/zoubiromar/kitchen-mania.git
   cd kitchen-mania
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   Create a `.env.local` file in the root directory with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Get Supabase credentials:**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Open your project
   - Go to Settings > API
   - Copy the "Project URL" to `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the "anon public" key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser

## Troubleshooting

### PowerShell Execution Policy Error

If you get an error about running scripts being disabled on Windows:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

Then run `npm run dev` again.

### Port Already in Use

If port 3000 is already in use, the app will automatically use the next available port (e.g., 3001, 3002).

### Supabase URL Error

If you see "supabaseUrl is required", make sure:
1. You've created the `.env.local` file
2. The environment variables are correctly set
3. Restart the development server after adding the file

## Known Issues

- Chrome extension errors in console: These are from browser extensions and don't affect the app
- 502 errors during image generation: The image generation still works, these can be ignored
- MutationObserver errors: These are from browser devtools and don't affect functionality

## Features

Once running locally, you can:
- Create an account and log in
- Manage your pantry items
- Generate recipe recommendations
- Track prices from receipts
- Customize your preferences

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/zoubiromar/kitchen-mania/issues)
- Review the deployment guide in `DEPLOYMENT.md`
- Check Supabase integration details in `SUPABASE_INTEGRATION.md` 