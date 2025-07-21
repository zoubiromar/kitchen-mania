import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, existingItems = [], unitSystem = 'imperial' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Please provide text to parse' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Fallback parser without AI
      const lines = text.split('\n').filter(line => line.trim());
      const items: any[] = [];
      const today = new Date().toISOString().split('T')[0];
      
      lines.forEach(line => {
        // Enhanced regex to handle various formats
        const patterns = [
          /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/,  // "2 lbs chicken"
          /^(.+?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/,  // "chicken - 2 lbs"
          /^(.+?)\s*\((\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\)$/,  // "chicken (2 lbs)"
        ];
        
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) {
            let name: string, quantity: number, unit: string;
            
            if (pattern === patterns[0]) {
              [, quantity, unit = 'pcs', name] = match as any;
            } else {
              [, name, quantity, unit = 'pcs'] = match as any;
            }
            
            name = name.trim();
            const existing = existingItems.find((item: any) => 
              item.name.toLowerCase() === name.toLowerCase()
            );
            
            items.push({
              exists: !!existing,
              name: existing ? existing.name : name,
              quantity: parseFloat(quantity as any),
              unit: unit.trim(),
              category: guessCategory(name),
              purchaseDate: today
            });
            break;
          }
        }
      });
      
      return NextResponse.json({ items });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const existingItemsText = existingItems.length > 0 
      ? `\n\nExisting pantry items:\n${existingItems.map((item: any) => item.name).join(', ')}`
      : '';

    const today = new Date().toISOString().split('T')[0];

    const unitPreferences = unitSystem === 'metric'
      ? 'Prefer metric units: kg, g for weight; liters, ml for volume'
      : 'Prefer imperial units: lbs, oz for weight; cups, fl oz for volume';
    
    const systemPrompt = `You are a helpful assistant that parses grocery lists into structured data.
Parse the provided text into a list of grocery items. 

CRITICAL: Each line may contain MULTIPLE items separated by commas, "and", or other delimiters.
For example: "2 oil litres, 5 eggs and 1 kg of butter" should parse as THREE separate items:
- oil: 2 litres
- eggs: 5 pcs
- butter: 1 kg

Parse carefully and extract ALL items. For each item:
1. Check if it matches an existing pantry item name (case-insensitive)
2. Extract the quantity and unit
3. Categorize appropriately

PARSING RULES:
- Split on commas, "and", "&", semicolons
- Handle formats like: "2 lbs chicken", "chicken 2 lbs", "2 chicken", "oil litres" (means 1 litre of oil)
- If quantity appears after the item name without a number (e.g., "oil litres"), assume quantity is 1
- If an item exists in the pantry, use the EXACT existing name and set exists=true
- If it's a new item, set exists=false and use a proper capitalized name
- Always include purchaseDate as today's date: ${today}
- ${unitPreferences}
- Standard units: pcs (for countable items like eggs), lbs, kg, g, oz, cups, tbsp, tsp, ml, l, litres, liters, fl oz, etc.
- Categories: Fruits, Vegetables, Meat, Dairy, Grains, Snacks, Beverages, Condiments, Oils, or Uncategorized

${existingItemsText}

Return ONLY a JSON array with this EXACT structure:
[{
  "exists": boolean,
  "name": "exact item name",
  "quantity": number,
  "unit": "unit",
  "category": "category",
  "purchaseDate": "${today}"
}]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    const items = JSON.parse(content);
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error parsing text:', error);
    return NextResponse.json(
      { error: 'Failed to parse text', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function guessCategory(itemName: string): string {
  const name = itemName.toLowerCase();
  
  const categories: Record<string, string[]> = {
    'Vegetables': ['carrot', 'potato', 'onion', 'garlic', 'tomato', 'lettuce', 'spinach', 'broccoli', 'pepper', 'cucumber'],
    'Fruits': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'mango', 'pineapple', 'watermelon', 'peach', 'pear'],
    'Meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'bacon', 'sausage', 'ham', 'steak'],
    'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg'],
    'Grains': ['rice', 'bread', 'pasta', 'cereal', 'oat', 'flour', 'wheat'],
    'Seafood': ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster'],
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  return 'Uncategorized';
} 