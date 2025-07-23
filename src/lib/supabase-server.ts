import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for use in API routes
// This uses the service role key which bypasses RLS policies

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create server client only if service role key exists
export const supabaseServer = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper to get the appropriate client
export function getSupabaseServer() {
  if (!supabaseServer) {
    console.warn('Service role key not found. Using anon client as fallback.')
    // Fallback to regular client if service role key not available
    const { supabase } = require('./supabase')
    return supabase
  }
  return supabaseServer
} 