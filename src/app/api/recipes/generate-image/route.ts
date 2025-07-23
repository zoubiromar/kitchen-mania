import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { downloadAndStoreImage } from '@/lib/imageStorage';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, ingredients } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Please provide a recipe title' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Return placeholder if no API key
      return NextResponse.json({
        imageUrl: `/api/placeholder/400/300?text=${encodeURIComponent(title)}`,
        isStored: false,
        warning: 'No OpenAI API key configured',
        debug: {
          step: 'no-api-key'
        }
      });
    }

    // Create a descriptive prompt for DALL-E
    const ingredientList = ingredients?.join(', ') || 'various ingredients';
    const prompt = `A professional food photography of ${title}, beautifully plated dish featuring ${ingredientList}, restaurant quality presentation, soft natural lighting, shallow depth of field, appetizing and fresh`;

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      });

      const dalleImageUrl = response.data?.[0]?.url;
      
      if (dalleImageUrl) {
        console.log('[Server] DALL-E image generated:', dalleImageUrl);
        
        // Download and store the image permanently
        const fileName = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const storageResult = await downloadAndStoreImage(dalleImageUrl, fileName);
        
        if (storageResult.success && storageResult.imageUrl) {
          console.log('[Server] Image stored successfully:', storageResult.imageUrl);
          return NextResponse.json({ 
            imageUrl: storageResult.imageUrl,
            isStored: true,
            originalUrl: dalleImageUrl,
            debug: {
              step: 'storage-success',
              fileName: fileName,
              storageUrl: storageResult.imageUrl
            }
          });
        } else {
          console.error('[Server] Failed to store image:', storageResult.error);
          // Still return the DALL-E URL as fallback
          return NextResponse.json({ 
            imageUrl: dalleImageUrl,
            isStored: false,
            storageError: storageResult.error,
            storageDetails: storageResult.details,
            warning: 'Image will expire in 2 hours. Storage failed: ' + storageResult.error,
            debug: {
              step: 'storage-failed',
              error: storageResult.error,
              details: storageResult.details
            }
          });
        }
      } else {
        throw new Error('No image URL in response');
      }
    } catch (dalleError: any) {
      console.error('[Server] DALL-E 3 error:', dalleError);
      
      // Try with DALL-E 2 if DALL-E 3 fails
      try {
        const response = await openai.images.generate({
          model: "dall-e-2",
          prompt: prompt.substring(0, 400), // DALL-E 2 has shorter prompt limit
          n: 1,
          size: "512x512",
        });

        const dalle2ImageUrl = response.data?.[0]?.url;
        
        if (dalle2ImageUrl) {
          console.log('[Server] DALL-E 2 image generated:', dalle2ImageUrl);
          
          // Download and store the DALL-E 2 image
          const fileName = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          const storageResult = await downloadAndStoreImage(dalle2ImageUrl, fileName);
          
          if (storageResult.success && storageResult.imageUrl) {
            return NextResponse.json({ 
              imageUrl: storageResult.imageUrl,
              isStored: true,
              model: 'dall-e-2',
              originalUrl: dalle2ImageUrl,
              debug: {
                step: 'dalle2-storage-success',
                fileName: fileName,
                storageUrl: storageResult.imageUrl
              }
            });
          } else {
            // Fallback to original URL
            return NextResponse.json({ 
              imageUrl: dalle2ImageUrl,
              isStored: false,
              storageError: storageResult.error,
              storageDetails: storageResult.details,
              model: 'dall-e-2',
              warning: 'Image will expire in 2 hours. Storage failed: ' + storageResult.error,
              debug: {
                step: 'dalle2-storage-failed',
                error: storageResult.error,
                details: storageResult.details
              }
            });
          }
        }
        
        return NextResponse.json({
          imageUrl: `/api/placeholder/400/300?text=${encodeURIComponent(title)}`,
          isStored: false,
          error: 'Failed to generate image with both DALL-E models',
          debug: {
            step: 'all-models-failed'
          }
        });
      } catch (dalle2Error: any) {
        console.error('[Server] DALL-E 2 error:', dalle2Error);
        throw dalle2Error;
      }
    }

  } catch (error: any) {
    console.error('[Server] Error generating recipe image:', error);
    
    const body = await request.json().catch(() => ({ title: 'Recipe' }));
    const { title } = body;
    
    // Return a placeholder image URL on error
    return NextResponse.json({
      imageUrl: `/api/placeholder/400/300?text=${encodeURIComponent(title || 'Recipe')}`,
      isStored: false,
      error: error.message || 'Unknown error occurred',
      debug: {
        step: 'error-catch',
        error: error.message,
        stack: error.stack
      }
    });
  }
} 