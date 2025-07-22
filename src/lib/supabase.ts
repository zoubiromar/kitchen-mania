import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      pantry_items: {
        Row: {
          id: string
          user_id: string
          name: string
          quantity: number
          unit: string
          emoji: string
          expiry_date: string | null
          category: string | null
          price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          quantity: number
          unit: string
          emoji: string
          expiry_date?: string | null
          category?: string | null
          price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          quantity?: number
          unit?: string
          emoji?: string
          expiry_date?: string | null
          category?: string | null
          price?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          ingredients: any[]
          instructions: string[]
          servings: number
          prep_time: number | null
          cook_time: number | null
          difficulty: string | null
          rating: number | null
          image_url: string | null
          unit_system: 'metric' | 'imperial'
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          ingredients: any[]
          instructions: string[]
          servings: number
          prep_time?: number | null
          cook_time?: number | null
          difficulty?: string | null
          rating?: number | null
          image_url?: string | null
          unit_system?: 'metric' | 'imperial'
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          ingredients?: any[]
          instructions?: string[]
          servings?: number
          prep_time?: number | null
          cook_time?: number | null
          difficulty?: string | null
          rating?: number | null
          image_url?: string | null
          unit_system?: 'metric' | 'imperial'
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      price_tracker_items: {
        Row: {
          id: string
          user_id: string
          name: string
          stores: any[]
          target_price: number | null
          unit: string
          emoji: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          stores: any[]
          target_price?: number | null
          unit: string
          emoji: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          stores?: any[]
          target_price?: number | null
          unit?: string
          emoji?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type PantryItem = Database['public']['Tables']['pantry_items']['Row']
export type Recipe = Database['public']['Tables']['recipes']['Row']
export type PriceTrackerItem = Database['public']['Tables']['price_tracker_items']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row'] 