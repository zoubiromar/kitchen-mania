# Supabase Integration Setup Guide

This guide explains how to set up and use Supabase authentication and database in your KitchenMania Next.js application.

## 🚀 Quick Start

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cabsqddxrinmezpnsjlh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYnNxZGR4cmlubWV6cG5zamxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNzExODUsImV4cCI6MjA2ODY0NzE4NX0.b-ZkVX5euE7fZq9ZrgBED-WEAMC3rT4j52GCjPZK7E0

# OpenAI Configuration (optional)
OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Vercel Environment Variables

These variables are already configured in Vercel for production deployment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📊 Database Setup

### 1. Run the SQL Schema

Copy and paste the contents of `supabase-schema.sql` into your Supabase SQL editor to create all necessary tables and security policies.

### 2. Database Tables Created

- **profiles**: User profile information
- **pantry_items**: User's pantry inventory
- **recipes**: User's saved recipes
- **price_tracker_items**: User's price tracking data

### 3. Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic Profile Creation**: Profile created automatically on user signup
- **Data Isolation**: Complete separation between user accounts

## 🔐 Authentication Usage

### Setting up AuthProvider

Wrap your app with the AuthProvider in your main layout:

```tsx
// src/app/layout.tsx
import { AuthProvider } from '@/components/AuthContext'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Using Authentication in Components

```tsx
import { useAuth } from '@/components/AuthContext'

function MyComponent() {
  const { user, signIn, signUp, signOut, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Protected Routes

```tsx
import { ProtectedRoute } from '@/components/AuthContext'

function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  )
}
```

## 🗄️ Database Operations

### Import Database Functions

```tsx
import { database } from '@/lib/database'
import { useAuth } from '@/components/AuthContext'
```

### Pantry Operations

```tsx
const { user } = useAuth()

// Get all pantry items
const { data: items, error } = await database.pantry.getAll(user.id)

// Add new item
const newItem = {
  name: 'Milk',
  quantity: 1,
  unit: 'L',
  emoji: '🥛',
  expiry_date: '2024-02-01',
  category: 'Dairy',
  price: 3.99
}
await database.pantry.add(user.id, newItem)

// Update item
await database.pantry.update(itemId, user.id, { quantity: 2 })

// Delete item
await database.pantry.delete(itemId, user.id)
```

### Recipe Operations

```tsx
// Get all recipes
const { data: recipes } = await database.recipes.getAll(user.id)

// Add new recipe
const newRecipe = {
  title: 'Pasta Carbonara',
  description: 'Classic Italian pasta dish',
  ingredients: [
    { name: 'Pasta', quantity: 400, unit: 'g' },
    { name: 'Eggs', quantity: 2, unit: 'pcs' }
  ],
  instructions: ['Cook pasta', 'Mix with eggs'],
  servings: 4,
  prep_time: 15,
  cook_time: 20,
  difficulty: 'Medium',
  rating: 5,
  image_url: null,
  unit_system: 'metric'
}
await database.recipes.add(user.id, newRecipe)
```

### Price Tracker Operations

```tsx
// Get all price tracker items
const { data: trackedItems } = await database.priceTracker.getAll(user.id)

// Add new tracked item
const newTrackedItem = {
  name: 'Coffee Beans',
  stores: [
    { store: 'Walmart', price: 12.99, date: '2024-01-20' },
    { store: 'Target', price: 13.49, date: '2024-01-20' }
  ],
  target_price: 10.00,
  unit: 'lb',
  emoji: '☕'
}
await database.priceTracker.add(user.id, newTrackedItem)
```

## 🔧 Example Usage

### Testing Database Functions

```tsx
import { exampleQueries } from '@/lib/database'

// Fetch all user data
const userData = await exampleQueries.fetchAllUserData(user.id)

// Add sample data for testing
await exampleQueries.addSamplePantryItems(user.id)
await exampleQueries.addSampleRecipe(user.id)
```

### Complete User Data Export

```tsx
import { database } from '@/lib/database'

const exportUserData = async (userId: string) => {
  const {
    pantryItems,
    recipes,
    priceTrackerItems,
    errors
  } = await database.utils.getAllUserData(userId)
  
  return { pantryItems, recipes, priceTrackerItems, errors }
}
```

## 🛠️ Integration with Existing Components

### Updating Pantry Page

Replace localStorage calls with Supabase operations:

```tsx
// Before (localStorage)
const items = JSON.parse(localStorage.getItem('pantryItems') || '[]')

// After (Supabase)
const { user } = useAuth()
const { data: items } = await database.pantry.getAll(user.id)
```

### Updating Recipe Components

```tsx
// Before (localStorage)
const recipes = JSON.parse(localStorage.getItem('recipes') || '[]')

// After (Supabase)
const { user } = useAuth()
const { data: recipes } = await database.recipes.getAll(user.id)
```

## 🔍 Data Migration

### Migrating from localStorage

If you have existing localStorage data, you can migrate it to Supabase:

```tsx
const migrateLocalStorageData = async (userId: string) => {
  // Migrate pantry items
  const localPantryItems = JSON.parse(localStorage.getItem('pantryItems') || '[]')
  if (localPantryItems.length > 0) {
    await database.pantry.bulkAdd(userId, localPantryItems)
    localStorage.removeItem('pantryItems')
  }

  // Migrate recipes
  const localRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
  for (const recipe of localRecipes) {
    await database.recipes.add(userId, recipe)
  }
  localStorage.removeItem('recipes')

  // Clear other localStorage items
  localStorage.removeItem('priceTracker')
  localStorage.removeItem('receipts')
}
```

## 🚨 Error Handling

All database functions return a consistent format:

```tsx
const { data, error } = await database.pantry.getAll(user.id)

if (error) {
  console.error('Database error:', error)
  // Handle error (show toast, etc.)
} else {
  // Use data
  console.log('Pantry items:', data)
}
```

## 📱 Real-time Updates

Supabase supports real-time subscriptions for live data updates:

```tsx
import { supabase } from '@/lib/supabase'

// Listen for pantry item changes
useEffect(() => {
  const subscription = supabase
    .channel('pantry_changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'pantry_items',
        filter: `user_id=eq.${user.id}`
      }, 
      (payload) => {
        console.log('Pantry updated:', payload)
        // Refresh data or update state
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [user.id])
```

## 🔒 Security Notes

1. **Environment Variables**: Keep your Supabase keys secure
2. **RLS Policies**: All tables have Row Level Security enabled
3. **User Isolation**: Users can only access their own data
4. **API Keys**: Use the anon key for client-side operations

## 📝 Next Steps

1. **Run the SQL schema** in your Supabase dashboard
2. **Update your components** to use Supabase instead of localStorage
3. **Test authentication flow** with sign up/sign in
4. **Verify data isolation** by creating test accounts
5. **Deploy to production** with environment variables set

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid API key"**: Check environment variables are set correctly
2. **"Row Level Security policy violation"**: Ensure user is authenticated
3. **"Table doesn't exist"**: Run the SQL schema in Supabase dashboard
4. **Connection timeout**: Check your Supabase project status

### Getting Help

- Check Supabase dashboard logs
- Verify environment variables
- Test with sample data using `exampleQueries`
- Check network tab for API call errors 