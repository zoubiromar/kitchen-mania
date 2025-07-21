# My Account Page Features

## Overview

The My Account page provides comprehensive user profile management with a clean, tabbed interface that's fully responsive for both desktop and mobile devices.

## Features

### 1. **Navigation Updates**
- Login button replaced with "My Account" when user is authenticated
- Sign out option in both desktop and mobile navigation
- User icon indicator for account access

### 2. **Profile Tab**
- **Avatar Upload**: 
  - Upload profile picture with preview
  - Images stored in Supabase Storage
  - Automatic image optimization
- **Username**: Custom username (unique across platform)
- **Bio**: Personal description/about section
- **Email**: Display only (cannot be changed)

### 3. **Preferences Tab**
- **Unit System Selection**:
  - Metric (kg, L, °C)
  - Imperial (lb, oz, °F)
- **Preferred Units**:
  - Quick-select commonly used units
  - Custom unit preferences saved per user
  - Units organized by type (weight, volume, common)
- **Default Recipe Servings**: Set default serving size for recipes

### 4. **Security Tab**
- **Password Change**:
  - Secure password update
  - Minimum 6 characters validation
  - Confirmation field to prevent typos
  - Success/error feedback

### 5. **Danger Zone Tab**
- **Account Deletion**:
  - Clear warning about data loss
  - Confirmation requirement (type "DELETE")
  - Lists all data that will be removed
  - Currently shows support contact (full deletion requires backend implementation)

## Mobile Optimization

- Responsive tab layout (2 columns on mobile, 4 on desktop)
- Touch-friendly buttons and inputs
- Optimized avatar upload for mobile cameras
- Proper spacing and sizing for small screens

## Database Updates Required

Run the `supabase-profile-update.sql` script in your Supabase SQL editor to add the new profile fields:

```sql
-- New columns added:
- username (unique)
- bio
- avatar_url
- unit_system
- preferred_units
- default_servings
```

## Supabase Configuration Required

### 1. **Email Redirect Fix**
- Go to Supabase Dashboard → Authentication → URL Configuration
- Set Site URL to: `https://kitchen-mania.vercel.app`
- This fixes the localhost redirect issue in confirmation emails

### 2. **Storage Bucket**
- The SQL script creates an 'avatars' bucket
- Public read access for avatar images
- Secure upload/update/delete policies

## Usage

### For Users:
1. Click "My Account" in navigation
2. Update profile information
3. Set measurement preferences
4. Upload profile picture
5. Change password as needed

### For Developers:
- Profile data stored in `profiles` table
- Avatar images in `avatars` storage bucket
- Preferences affect recipe generation and pantry units
- Unit system cascades to all measurements in the app

## Security Notes

- Passwords require minimum 6 characters
- Avatar uploads restricted to authenticated users
- Profile updates limited to own profile
- Account deletion requires explicit confirmation
- Email addresses cannot be changed (Supabase limitation)

## Future Enhancements

- Social profile linking
- Export user data
- Email notifications preferences
- Theme selection (dark/light mode)
- Language preferences
- API key management for external integrations 