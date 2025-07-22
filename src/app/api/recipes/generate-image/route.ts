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
        imageUrl: `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(title)}`,
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
        // Download and store the image permanently
        const fileName = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const storageResult = await downloadAndStoreImage(dalleImageUrl, fileName);
        
        if (storageResult.success) {
          console.log('Image stored successfully:', storageResult.imageUrl);
          return NextResponse.json({ 
            imageUrl: storageResult.imageUrl,
            isStored: true 
          });
        } else {
          console.error('Failed to store image:', storageResult.error);
          // Fallback to original DALL-E URL if storage fails
          return NextResponse.json({ 
            imageUrl: dalleImageUrl,
            isStored: false,
            storageError: storageResult.error
          });
        }
      } else {
        throw new Error('No image URL in response');
      }
    } catch (dalleError) {
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
          // Download and store the DALL-E 2 image
          const fileName = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          const storageResult = await downloadAndStoreImage(dalle2ImageUrl, fileName);
          
          if (storageResult.success) {
            return NextResponse.json({ 
              imageUrl: storageResult.imageUrl,
              isStored: true,
              model: 'dall-e-2'
            });
          } else {
            // Fallback to original URL
            return NextResponse.json({ 
              imageUrl: dalle2ImageUrl,
              isStored: false,
              storageError: storageResult.error,
              model: 'dall-e-2'
            });
          }
        }
        
        return NextResponse.json({
          imageUrl: `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(title)}`,
          isStored: false
        });
      } catch (dalle2Error) {
        console.error('DALL-E 2 error:', dalle2Error);
        throw dalle2Error;
      }
    }

  } catch (error) {
    console.error('Error generating recipe image:', error);
    
    const body = await request.json().catch(() => ({ title: 'Recipe' }));
    const { title } = body;
    
    // Return a placeholder image URL on error
    return NextResponse.json({
      imageUrl: `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(title || 'Recipe')}`,
      isStored: false
    });
  }
} 