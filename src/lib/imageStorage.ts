import { supabase } from './supabase'
import { getSupabaseServer } from './supabase-server'

export interface ImageUploadResult {
  success: boolean
  imageUrl?: string
  error?: string
  details?: any
}

// Helper to determine if we're running on server
function isServer() {
  return typeof window === 'undefined'
}

// Get the appropriate Supabase client based on context
function getSupabaseClient() {
  if (isServer()) {
    // Use server client with service role in API routes
    return getSupabaseServer()
  }
  // Use regular client for browser operations
  return supabase
}

/**
 * Downloads an image from a URL and uploads it to Supabase Storage
 */
export async function downloadAndStoreImage(
  imageUrl: string, 
  fileName: string,
  bucket: string = 'recipe-images'
): Promise<ImageUploadResult> {
  try {
    console.log(`[Server] Attempting to download image from: ${imageUrl}`);
    console.log(`[Server] Using service role: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
    
    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    console.log(`[Server] Downloaded image: ${blob.size} bytes, type: ${blob.type}`);
    
    // Validate blob
    if (blob.size === 0) {
      throw new Error('Downloaded image is empty')
    }
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = blob.type.split('/')[1] || 'png'
    const uniqueFileName = `${fileName}_${timestamp}.${fileExtension}`
    
    console.log(`[Server] Uploading to Supabase: ${uniqueFileName} in bucket: ${bucket}`);

    // Get server client for API routes
    const supabaseClient = getSupabaseClient()

    // Upload to Supabase Storage - using upsert: true like avatar upload
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(uniqueFileName, blob, {
        contentType: blob.type,
        upsert: true, // Changed to true to match avatar upload
        cacheControl: '3600'
      })

    if (error) {
      console.error('[Server] Supabase storage error:', error)
      // Check if it's a bucket not found error
      if (error.message?.includes('not found')) {
        return { 
          success: false, 
          error: `Storage bucket "${bucket}" not found. Please create it in Supabase Dashboard.`,
          details: error 
        }
      }
      // Check for policy errors
      if (error.message?.includes('policy') || error.message?.includes('row-level security')) {
        return { 
          success: false, 
          error: `Storage policy error. Please check bucket policies for "${bucket}".`,
          details: error 
        }
      }
      return { success: false, error: error.message, details: error }
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(data.path)
    
    console.log('[Server] Image stored successfully at:', urlData.publicUrl);

    return {
      success: true,
      imageUrl: urlData.publicUrl
    }

  } catch (error) {
    console.error('[Server] Error storing image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while storing image',
      details: error
    }
  }
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteStoredImage(
  imageUrl: string,
  bucket: string = 'recipe-images'
): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathMatch = url.pathname.match(`/storage/v1/object/public/${bucket}/(.+)`)
    
    if (!pathMatch) {
      console.warn('Could not extract file path from URL:', imageUrl)
      return false
    }

    const filePath = pathMatch[1]
    console.log(`[Server] Deleting image: ${filePath} from bucket: ${bucket}`);

    // Get appropriate client
    const supabaseClient = getSupabaseClient()

    const { error } = await supabaseClient.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('[Server] Error deleting image:', error)
      return false
    }

    console.log('[Server] Image deleted successfully');
    return true
  } catch (error) {
    console.error('[Server] Error deleting image:', error)
    return false
  }
}

/**
 * Uploads a file directly to Supabase Storage
 */
export async function uploadImageFile(
  file: File,
  fileName: string,
  bucket: string = 'recipe-images'
): Promise<ImageUploadResult> {
  try {
    const timestamp = Date.now()
    const fileExtension = file.type.split('/')[1] || 'png'
    const uniqueFileName = `${fileName}_${timestamp}.${fileExtension}`

    console.log(`[Client] Uploading file: ${uniqueFileName} to bucket: ${bucket}`);

    // Get appropriate client
    const supabaseClient = getSupabaseClient()

    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(uniqueFileName, file, {
        contentType: file.type,
        upsert: true, // Changed to match avatar upload
        cacheControl: '3600'
      })

    if (error) {
      console.error('[Client] Supabase upload error:', error);
      if (error.message?.includes('not found')) {
        return { 
          success: false, 
          error: `Storage bucket "${bucket}" not found. Please create it in Supabase Dashboard.`,
          details: error 
        }
      }
      if (error.message?.includes('policy') || error.message?.includes('row-level security')) {
        return { 
          success: false, 
          error: `Storage policy error. Please check bucket policies for "${bucket}".`,
          details: error 
        }
      }
      return { success: false, error: error.message, details: error }
    }

    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('[Client] File uploaded successfully to:', urlData.publicUrl);

    return {
      success: true,
      imageUrl: urlData.publicUrl
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during upload',
      details: error
    }
  }
}

/**
 * Checks if a URL is from our Supabase storage
 */
export function isStoredImage(url: string, bucket: string = 'recipe-images'): boolean {
  return url.includes('/storage/v1/object/public/' + bucket)
} 