# 🚨 URGENT: Fix Email Confirmation OTP Expiry

## The Problem
Users are getting "otp_expired" error when clicking confirmation links. This means the link has expired before they could use it.

## ✅ IMMEDIATE FIXES

### Fix 1: Extend OTP Expiry Time (Do This First!)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers** → **Email**
4. Find **"Confirm email" OTP expiry**
5. Change from default (3600 seconds/1 hour) to:
   ```
   86400
   ```
   (This is 24 hours in seconds)
6. Click **Save**

### Fix 2: Verify Site URL (Again)

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Make SURE **Site URL** is:
   ```
   https://kitchen-mania.vercel.app
   ```
   NOT `http://localhost:3000`
3. Click **Save**

### Fix 3: For Users Stuck in "Waiting for verification"

#### Option A: Manual Confirmation (Quick Fix)
1. Go to **Authentication** → **Users**
2. Find the stuck user
3. Click on the user
4. Click **"Confirm email"** button manually

#### Option B: Resend Confirmation Email
1. Have the user try logging in again
2. They should see a "Resend confirmation email" option
3. The new email will have a fresh, non-expired link

### Fix 4: Update Email Template (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Click **Confirm signup**
3. In the template, you can add a note about link expiry:
   ```html
   <p>Please confirm your email within 24 hours by clicking the link below:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
   <p style="color: #666; font-size: 12px;">This link will expire in 24 hours. If it expires, please sign in to request a new confirmation email.</p>
   ```

## 🔧 Testing After Fixes

1. Create a new test account
2. Check email immediately
3. Click the confirmation link
4. Should redirect to: `https://kitchen-mania.vercel.app/auth/confirm` with success

## ⚠️ If Still Having Issues

The user might be clicking OLD emails with expired links. Make sure they:
1. Use the LATEST email
2. Click within 24 hours
3. Or request a new confirmation email by trying to log in 