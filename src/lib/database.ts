import { supabase } from './supabase'
import type { PantryItem, Recipe, PriceTrackerItem } from './supabase'

export const database = {
  // Pantry Items
  pantry: {
    // Get all pantry items for user
    async getAll(userId: string) {
      try {
        const { data, error } = await supabase
          .from('pantry_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Add new pantry item
    async add(userId: string, item: Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
      try {
        const { data, error } = await supabase
          .from('pantry_items')
          .insert({
            ...item,
            user_id: userId,
          })
          .select()
          .single()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Update pantry item
    async update(id: string, userId: string, updates: Partial<PantryItem>) {
      try {
        const { data, error } = await supabase
          .from('pantry_items')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Delete pantry item
    async delete(id: string, userId: string) {
      try {
        const { error } = await supabase
          .from('pantry_items')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
        
        if (error) throw error
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    },

    // Bulk add items (for receipt parsing)
    async bulkAdd(userId: string, items: Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) {
      try {
        const itemsWithUserId = items.map(item => ({
          ...item,
          user_id: userId,
        }))
        
        const { data, error } = await supabase
          .from('pantry_items')
          .insert(itemsWithUserId)
          .select()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },
  },

  // Recipes
  recipes: {
    // Get all recipes for user
    async getAll(userId: string) {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Get recipe by ID
    async getById(id: string, userId: string) {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Add new recipe
    async add(userId: string, recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .insert({
            ...recipe,
            user_id: userId,
          })
          .select()
          .single()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Update recipe
    async update(id: string, userId: string, updates: Partial<Recipe>) {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Delete recipe
    async delete(id: string, userId: string) {
      try {
        const { error } = await supabase
          .from('recipes')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
        
        if (error) throw error
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    },

    // Get recipes by rating
    async getByRating(userId: string, minRating: number = 4) {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('user_id', userId)
          .gte('rating', minRating)
          .order('rating', { ascending: false })
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },
  },

  // Price Tracker
  priceTracker: {
    // Get all price tracker items for user
    async getAll(userId: string) {
      try {
        const { data, error } = await supabase
          .from('price_tracker_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Add new price tracker item
    async add(userId: string, item: Omit<PriceTrackerItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
      try {
        const { data, error } = await supabase
          .from('price_tracker_items')
          .insert({
            ...item,
            user_id: userId,
          })
          .select()
          .single()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Update price tracker item
    async update(id: string, userId: string, updates: Partial<PriceTrackerItem>) {
      try {
        const { data, error } = await supabase
          .from('price_tracker_items')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Delete price tracker item
    async delete(id: string, userId: string) {
      try {
        const { error } = await supabase
          .from('price_tracker_items')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
        
        if (error) throw error
        return { error: null }
      } catch (error) {
        return { error: error as Error }
      }
    },

    // Update store prices for an item
    async updateStorePrices(id: string, userId: string, stores: any[]) {
      try {
        const { data, error } = await supabase
          .from('price_tracker_items')
          .update({
            stores,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },
  },

  // General utility functions
  utils: {
    // Get user's profile
    async getUserProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Update user's profile
    async updateUserProfile(userId: string, updates: { email?: string }) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select()
          .single()
        
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error: error as Error }
      }
    },

    // Get user's complete data (for export or backup)
    async getAllUserData(userId: string) {
      try {
        const [pantryResult, recipesResult, priceTrackerResult] = await Promise.all([
          database.pantry.getAll(userId),
          database.recipes.getAll(userId),
          database.priceTracker.getAll(userId),
        ])

        return {
          pantryItems: pantryResult.data || [],
          recipes: recipesResult.data || [],
          priceTrackerItems: priceTrackerResult.data || [],
          errors: [
            pantryResult.error,
            recipesResult.error,
            priceTrackerResult.error,
          ].filter(Boolean),
        }
      } catch (error) {
        return {
          pantryItems: [],
          recipes: [],
          priceTrackerItems: [],
          errors: [error as Error],
        }
      }
    },
  },
}

// Example usage functions for testing
export const exampleQueries = {
  // Example: Fetch all user data
  async fetchAllUserData(userId: string) {
    console.log('Fetching all data for user:', userId)
    
    const result = await database.utils.getAllUserData(userId)
    console.log('User data:', result)
    
    return result
  },

  // Example: Add sample pantry items
  async addSamplePantryItems(userId: string) {
    const sampleItems = [
      { name: 'Milk', quantity: 1, unit: 'L', emoji: '🥛', expiry_date: '2024-02-01', category: 'Dairy', price: 3.99 },
      { name: 'Bread', quantity: 1, unit: 'loaf', emoji: '🍞', expiry_date: '2024-01-25', category: 'Bakery', price: 2.50 },
      { name: 'Apples', quantity: 6, unit: 'pcs', emoji: '🍎', expiry_date: '2024-02-10', category: 'Fruits', price: 4.99 },
    ]

    const results = await Promise.all(
      sampleItems.map(item => database.pantry.add(userId, item))
    )

    console.log('Added sample pantry items:', results)
    return results
  },

  // Example: Add sample recipe
  async addSampleRecipe(userId: string) {
    const sampleRecipe = {
      title: 'Simple Pancakes',
      description: 'Easy and delicious pancakes',
      ingredients: [
        { name: 'Flour', quantity: 2, unit: 'cups' },
        { name: 'Milk', quantity: 1, unit: 'cup' },
        { name: 'Eggs', quantity: 2, unit: 'pcs' },
        { name: 'Sugar', quantity: 2, unit: 'tbsp' },
      ],
      instructions: [
        'Mix dry ingredients in a bowl',
        'Add wet ingredients and stir until smooth',
        'Cook on medium heat until golden brown',
        'Serve with syrup and enjoy!',
      ],
      servings: 4,
      prep_time: 10,
      cook_time: 15,
      difficulty: 'Easy',
      rating: 5,
      image_url: null,
      unit_system: 'metric' as const,
      tags: []
    }

    const result = await database.recipes.add(userId, sampleRecipe)
    console.log('Added sample recipe:', result)
    
    return result
  },
} 