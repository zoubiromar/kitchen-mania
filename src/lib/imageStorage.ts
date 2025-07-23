import { supabase } from './supabase'

export interface ImageUploadResult {
  success: boolean
  imageUrl?: string
  error?: string
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
    console.log(`Attempting to download image from: ${imageUrl}`);
    
    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    console.log(`Downloaded image: ${blob.size} bytes, type: ${blob.type}`);
    
    // Validate blob
    if (blob.size === 0) {
      throw new Error('Downloaded image is empty')
    }
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = blob.type.split('/')[1] || 'png'
    const uniqueFileName = `${fileName}_${timestamp}.${fileExtension}`
    
    console.log(`Uploading to Supabase: ${uniqueFileName} in bucket: ${bucket}`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, blob, {
        contentType: blob.type,
        upsert: false,
        cacheControl: '3600' // Cache for 1 hour
      })

    if (error) {
      console.error('Supabase storage error:', error)
      // Check if it's a bucket not found error
      if (error.message?.includes('not found')) {
        return { 
          success: false, 
          error: `Storage bucket "${bucket}" not found. Please create it in Supabase Dashboard.` 
        }
      }
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)
    
    console.log('Image stored successfully at:', urlData.publicUrl);

    return {
      success: true,
      imageUrl: urlData.publicUrl
    }

  } catch (error) {
    console.error('Error storing image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while storing image'
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
    console.log(`Deleting image: ${filePath} from bucket: ${bucket}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Error deleting image:', error)
      return false
    }

    console.log('Image deleted successfully');
    return true
  } catch (error) {
    console.error('Error deleting image:', error)
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

    console.log(`Uploading file: ${uniqueFileName} to bucket: ${bucket}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      })

    if (error) {
      console.error('Supabase upload error:', error);
      if (error.message?.includes('not found')) {
        return { 
          success: false, 
          error: `Storage bucket "${bucket}" not found. Please create it in Supabase Dashboard.` 
        }
      }
      return { success: false, error: error.message }
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('File uploaded successfully to:', urlData.publicUrl);

    return {
      success: true,
      imageUrl: urlData.publicUrl
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during upload'
    }
  }
}

/**
 * Checks if an image URL is a stored Supabase image
 */
export function isStoredImage(imageUrl: string, bucket: string = 'recipe-images'): boolean {
  return imageUrl.includes(`/storage/v1/object/public/${bucket}/`)
} 