# Supabase Email Configuration Guide

## Important: Configure Email Templates in Supabase Dashboard

To ensure email confirmations work correctly with your deployed app, you need to update the email templates in your Supabase dashboard.

### Step 1: Access Email Templates

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project (`cabsqddxrinmezpnsjlh`)
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Redirect URLs

You need to update the following templates:

#### 1. Confirm Signup Template

Find the "Confirm signup" template and update the confirmation URL:

**Default:**
```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```

**Updated (Recommended):**
```html
<h2>Welcome to KitchenMania!</h2>
<p>Thanks for signing up. Please confirm your email address by clicking the link below:</p>
<a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Confirm Email Address</a>
<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
```

### Step 3: Configure Site URL (CRITICAL FOR EMAIL REDIRECTS)

**⚠️ THIS IS THE MOST IMPORTANT STEP TO FIX LOCALHOST REDIRECTS ⚠️**

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Update the following settings:

   - **Site URL**: `https://kitchen-mania.vercel.app` (NOT localhost!)
   - **Redirect URLs** (add all of these):
     ```
     https://kitchen-mania.vercel.app/**
     https://kitchen-mania.vercel.app/auth/confirm
     http://localhost:3000/**
     http://localhost:3001/**
     http://localhost:3002/**
     ```

**Note**: The Site URL is what Supabase uses for email links. If this is set to localhost, all email confirmation links will redirect to localhost instead of your production site.

### Step 4: Environment Variables in Vercel

Make sure these environment variables are set in your Vercel project:

1. Go to your [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Ensure these are set:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `NEXT_PUBLIC_APP_URL`: `https://kitchen-mania.vercel.app`

### Step 5: Test the Flow

1. Create a new account on your deployed app
2. Check your email for the confirmation link
3. Click the link - it should redirect to `https://kitchen-mania.vercel.app/auth/confirm`
4. You should see a success message and be redirected to login
5. Sign in with your credentials

## Troubleshooting

### "Email link is invalid or has expired"

This error can occur if:
1. The confirmation link was already used
2. The link expired (default is 24 hours)
3. The redirect URL doesn't match what's configured in Supabase

**Solution**: Try signing up again with a fresh email address.

### Email redirects to localhost

This happens when the Supabase project doesn't have the correct Site URL configured. Follow Step 3 above.

### No confirmation email received

1. Check spam folder
2. Verify email address is correct
3. Check Supabase Dashboard → **Authentication** → **Logs** for any errors

## Development vs Production

- **Development**: Uses `window.location.origin` (e.g., `http://localhost:3000`)
- **Production**: Uses configured redirect URLs (e.g., `https://kitchen-mania.vercel.app`)

This ensures the confirmation flow works correctly in both environments.

## Security Note

The current setup allows users to access the app immediately after signup, even without email confirmation. To require email confirmation:

1. Update your auth logic to check `user.email_confirmed_at`
2. Redirect unconfirmed users to a "Please confirm your email" page
3. Only allow access to the main app after confirmation

This is optional but recommended for production apps. 