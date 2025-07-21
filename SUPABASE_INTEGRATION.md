# Supabase Integration Guide for KitchenMania

This guide outlines how to add user authentication and cloud storage to KitchenMania using Supabase.

## Overview

Currently, KitchenMania uses localStorage for data persistence. To enable multi-user functionality and cloud sync, we'll integrate Supabase for:
- User authentication (email/password, OAuth)
- Cloud database for user data
- Real-time sync across devices
- Secure API access

## Prerequisites

1. Supabase account at [supabase.com](https://supabase.com)
2. KitchenMania deployed to Vercel (current step)
3. Basic understanding of authentication concepts

## Phase 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Create new project
3. Save your project URL and anon key

### 1.2 Database Schema
```sql
-- Users table (handled by Supabase Auth)

-- Pantry Items
CREATE TABLE pantry_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  quantity DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  category TEXT,
  expiry_date DATE,
  purchase_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes
CREATE TABLE recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,
  instructions TEXT[] NOT NULL,
  servings TEXT,
  prep_time TEXT,
  image_url TEXT,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price History
CREATE TABLE price_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  price_per_unit DECIMAL,
  total_price DECIMAL,
  quantity DECIMAL,
  unit TEXT,
  merchant TEXT,
  receipt_id UUID,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts
CREATE TABLE receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant TEXT,
  date DATE NOT NULL,
  total DECIMAL,
  item_count INTEGER,
  items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_system TEXT DEFAULT 'imperial',
  default_servings INTEGER DEFAULT 2,
  dietary_preferences TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own pantry items" ON pantry_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry items" ON pantry_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pantry items" ON pantry_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry items" ON pantry_items
  FOR DELETE USING (auth.uid() = user_id);

-- Repeat similar policies for other tables
```

## Phase 2: Code Integration

### 2.1 Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 2.2 Environment Variables
Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2.3 Create Supabase Client
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 2.4 Add Authentication Pages
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/reset-password` - Password reset
- `/auth/profile` - User profile management

### 2.5 Update Data Layer
Replace localStorage calls with Supabase queries:

```typescript
// Before (localStorage)
const items = JSON.parse(localStorage.getItem('pantryItems') || '[]');

// After (Supabase)
const { data: items, error } = await supabase
  .from('pantry_items')
  .select('*')
  .order('created_at', { ascending: false });
```

### 2.6 Add Auth Middleware
```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## Phase 3: Migration Strategy

### 3.1 Gradual Migration
1. Deploy current version (localStorage)
2. Add Supabase auth alongside existing functionality
3. Add data sync between localStorage and Supabase
4. Gradually move features to use Supabase
5. Remove localStorage dependency

### 3.2 Data Migration Tool
Create a tool to migrate existing localStorage data to Supabase:

```typescript
async function migrateUserData() {
  const user = await supabase.auth.getUser();
  if (!user) return;

  // Migrate pantry items
  const localItems = JSON.parse(localStorage.getItem('pantryItems') || '[]');
  for (const item of localItems) {
    await supabase.from('pantry_items').insert({
      ...item,
      user_id: user.id
    });
  }

  // Migrate other data...
  
  // Clear localStorage after successful migration
  localStorage.clear();
}
```

## Phase 4: Enhanced Features

With Supabase, you can add:

### 4.1 Real-time Sync
```typescript
// Subscribe to pantry changes
supabase
  .channel('pantry_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pantry_items'
  }, payload => {
    // Update UI in real-time
  })
  .subscribe()
```

### 4.2 Sharing Features
- Share pantry with family members
- Collaborative shopping lists
- Shared recipes

### 4.3 Advanced Analytics
- Spending trends over time
- Nutritional tracking
- Waste reduction metrics

### 4.4 Mobile App
With cloud sync, easily create a React Native app

## Implementation Timeline

**Week 1-2: Setup & Auth**
- Supabase project setup
- Basic authentication flow
- User registration/login

**Week 3-4: Data Migration**
- Database schema
- Migration scripts
- Update CRUD operations

**Week 5-6: Testing & Optimization**
- Comprehensive testing
- Performance optimization
- Bug fixes

**Week 7-8: Enhanced Features**
- Real-time sync
- Sharing capabilities
- Mobile responsiveness

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Supabase Auth Helpers](https://github.com/supabase/auth-helpers)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Next Steps

1. Deploy current version to Vercel
2. Set up Supabase project
3. Create development branch for auth integration
4. Implement authentication
5. Gradually migrate features
6. Deploy authenticated version

This approach ensures zero downtime and a smooth transition for users. 