# KitchenMania Deployment Guide

This guide walks you through deploying KitchenMania to Vercel.

## Pre-Deployment Checklist

✅ **1. Environment Variables**
- Create a `.env.local` file (copy from `.env.local.example`)
- Add your OpenAI API key:
  ```
  OPENAI_API_KEY=your_actual_api_key_here
  ```

✅ **2. Build Test**
- Run `npm run build` locally to ensure no errors
- All critical errors have been fixed; warnings are acceptable

✅ **3. Git Repository**
- Ensure all files are committed
- `.gitignore` is properly configured
- Sensitive files are excluded

## Deployment Options

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - KitchenMania app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/KitchenMania.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select "KitchenMania"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add: `OPENAI_API_KEY` = `your_actual_api_key`
   - Add any other variables as needed

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (3-5 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow Prompts**
   - Set up and deploy: Y
   - Which scope: Select your account
   - Link to existing project: N
   - Project name: KitchenMania
   - Directory: ./
   - Build Command: (auto-detected)
   - Output Directory: (auto-detected)
   - Development Command: (auto-detected)

5. **Set Environment Variables**
   ```bash
   vercel env add OPENAI_API_KEY production
   ```
   Then paste your API key when prompted.

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Post-Deployment

### Custom Domain (Optional)
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Environment Variables
- Production: Set in Vercel dashboard
- Development: Keep in `.env.local` (not committed)
- Preview: Can set separate variables for preview deployments

### Monitoring
- Check deployment logs in Vercel dashboard
- Monitor function execution times
- Set up alerts for errors

## Troubleshooting

### Build Fails
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

### API Errors
- Verify OpenAI API key is correct
- Check API usage limits
- Monitor function timeouts (30s limit)

### Performance Issues
- Enable caching for API responses
- Optimize images with Next.js Image component
- Use incremental static regeneration if needed

## Features Without API Key

The app includes fallback functionality:
- Manual item entry works
- Basic recipe templates available
- Price tracking functions normally
- Receipt scanning shows mock data

## Next Steps

1. **Set up monitoring**: Use Vercel Analytics
2. **Add error tracking**: Consider Sentry integration
3. **Optimize performance**: Enable caching strategies
4. **Scale as needed**: Upgrade Vercel plan for more usage

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
- OpenAI API: [platform.openai.com/docs](https://platform.openai.com/docs) 