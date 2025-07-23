// Debug utility for image generation
export async function generateImageWithDebug(title: string, ingredients?: string[]) {
  console.log('🎨 Starting image generation for:', title);
  
  try {
    const response = await fetch('/api/recipes/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ingredients }),
    });
    
    const data = await response.json();
    
    console.log('📷 Image generation response:', {
      isStored: data.isStored,
      imageUrl: data.imageUrl?.substring(0, 50) + '...',
      debug: data.debug,
      warning: data.warning,
      storageError: data.storageError,
      storageDetails: data.storageDetails
    });
    
    if (data.debug) {
      console.log('🔍 Debug info:', data.debug);
    }
    
    if (data.storageError) {
      console.error('❌ Storage error:', data.storageError);
      if (data.storageDetails) {
        console.error('Storage details:', data.storageDetails);
      }
    }
    
    if (data.isStored) {
      console.log('✅ Image stored successfully in Supabase!');
    } else {
      console.warn('⚠️ Image NOT stored in Supabase - using temporary URL');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Failed to generate image:', error);
    throw error;
  }
} 