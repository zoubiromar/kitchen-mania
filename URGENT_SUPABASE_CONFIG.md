# 🚨 URGENT: Fix Email Redirect to Localhost Issue

## The Problem
Your confirmation emails are redirecting to localhost instead of your production app. This MUST be fixed in your Supabase Dashboard.

## ✅ IMMEDIATE ACTION REQUIRED

### Step 1: Go to Supabase Dashboard
1. Open [https://app.supabase.com](https://app.supabase.com)
2. Select your project (cabsqddxrinmezpnsjlh)

### Step 2: Fix Site URL (MOST IMPORTANT)
1. Navigate to **Authentication** → **URL Configuration**
2. Find the **Site URL** field
3. Change it from `http://localhost:3000` to:
   ```
   https://kitchen-mania.vercel.app
   ```
4. Click **Save**

### Step 3: Add Redirect URLs
In the same **URL Configuration** page:
1. Find **Redirect URLs**
2. Add ALL of these URLs (one per line):
   ```
   https://kitchen-mania.vercel.app/**
   https://kitchen-mania.vercel.app/auth/confirm
   https://kitchen-mania.vercel.app/login
   http://localhost:3000/**
   http://localhost:3001/**
   http://localhost:3002/**
   ```
3. Click **Save**

### Step 4: Verify Email Templates (Optional but Recommended)
1. Go to **Authentication** → **Email Templates**
2. Click on **Confirm signup**
3. The template should contain `{{ .ConfirmationURL }}`
4. This will now use your production URL instead of localhost

## 🎯 Testing After Configuration

1. Create a new account with a fresh email
2. Check your email
3. The confirmation link should now go to: `https://kitchen-mania.vercel.app/auth/confirm`
4. Click the link - it should work properly now!

## ⚠️ Common Mistakes to Avoid

- **DON'T** leave Site URL as localhost
- **DON'T** forget to save after making changes
- **DON'T** use the same email that already has a pending/expired confirmation

## 🔧 If Still Having Issues

1. Check Supabase Dashboard → **Authentication** → **Logs** for errors
2. Try with a completely new email address
3. Clear your browser cache
4. Make sure your Vercel deployment is up to date

## 📝 Note
The code is already set up correctly. This is purely a Supabase Dashboard configuration issue. Once you update the Site URL, everything will work! 