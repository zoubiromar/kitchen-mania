import { supabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
}

// Auth functions
export const auth = {
  // Sign up new user
  async signUp(email: string, password: string) {
    try {
      // Get the correct redirect URL based on environment
      // For production, this should use your actual deployed URL
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/confirm`
        : process.env.NEXT_PUBLIC_APP_URL 
          ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`
          : 'https://kitchen-mania.vercel.app/auth/confirm'
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        }
      })
      
      if (error) throw error
      
      // Note: Profile creation is handled by the database trigger
      // No need to manually create it here
      
      return { user: data.user, error: null }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      return { user: data.user, error: null }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  },

  // Sign out current user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email!,
      } : null
      callback(user)
    })
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }
} 