import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

      const imageUrl = response.data?.[0]?.url;
      
      if (imageUrl) {
        return NextResponse.json({ imageUrl });
      } else {
        throw new Error('No image URL in response');
      }
    } catch (dalleError: any) {
      // Try with DALL-E 2 if DALL-E 3 fails
      try {
        const response = await openai.images.generate({
          model: "dall-e-2",
          prompt: prompt.substring(0, 400), // DALL-E 2 has shorter prompt limit
          n: 1,
          size: "512x512",
        });

        const imageUrl = response.data?.[0]?.url;
        return NextResponse.json({ imageUrl: imageUrl || `/api/placeholder/400/300?text=${encodeURIComponent(title)}` });
      } catch (dalle2Error) {
        console.error('DALL-E 2 error:', dalle2Error);
        throw dalle2Error;
      }
    }

  } catch (error) {
    console.error('Error generating recipe image:', error);
    
    const body = await request.json();
    const { title } = body;
    
    // Return a placeholder image URL on error
    return NextResponse.json({
      imageUrl: `/api/placeholder/400/300?text=${encodeURIComponent(title || 'Recipe')}`,
    });
  }
} 