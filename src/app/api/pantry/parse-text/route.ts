import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  exists?: boolean;
  purchaseDate?: string;
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

    const today = new Date().toISOString().split('T')[0];

    // First try OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const existingItemsText = existingItems.length > 0 
          ? `\n\nEXISTING PANTRY ITEMS (match exactly if found):\n${existingItems.map((item: any) => `- ${item.name}`).join('\n')}`
          : '';

        const unitPreferences = unitSystem === 'metric'
          ? 'Prefer metric units: kg, g, L, ml, liters, litres'
          : 'Prefer imperial units: lbs, oz, cups, fl oz, gal';
        
        const systemPrompt = `You are a grocery list parser. Extract items from text and return ONLY valid JSON.

CRITICAL RULES:
1. Split on: commas, "and", "&", semicolons, line breaks
2. Each item = separate JSON object
3. Handle formats: "2 lbs chicken", "chicken 2 lbs", "oil litres" (=1 litre oil)
4. Match existing items EXACTLY (case-insensitive), set exists=true
5. New items: exists=false, proper capitalization
6. Default unit: "pcs" for countable items
7. ${unitPreferences}

EXAMPLES:
Input: "2 oil litres, 5 eggs and 1 kg of butter"
Output: [
  {"exists":false,"name":"Oil","quantity":2,"unit":"litres","category":"Condiments","purchaseDate":"${today}"},
  {"exists":true,"name":"Eggs","quantity":5,"unit":"pcs","category":"Dairy","purchaseDate":"${today}"},
  {"exists":false,"name":"Butter","quantity":1,"unit":"kg","category":"Dairy","purchaseDate":"${today}"}
]

RETURN ONLY JSON ARRAY:${existingItemsText}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Parse this grocery list: "${text}"` }
          ],
          temperature: 0.1,
          max_tokens: 1500,
        });

        const content = completion.choices[0]?.message?.content || '[]';
        let items: ParsedItem[] = [];
        
        try {
          // Clean the response to ensure it's valid JSON
          const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
          items = JSON.parse(cleanContent);
          
          // Validate the structure
          if (!Array.isArray(items)) {
            throw new Error('Response is not an array');
          }
          
          // Ensure all items have required fields
          items = items.map(item => ({
            exists: item.exists || false,
            name: item.name || 'Unknown Item',
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
            unit: item.unit || 'pcs',
            category: item.category || guessCategory(item.name || 'Unknown'),
            purchaseDate: today
          }));
          
          if (items.length > 0) {
            return NextResponse.json({ items });
          }
        } catch (parseError) {
          console.error('OpenAI JSON parse error:', parseError);
          // Fall through to fallback parser
        }
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        // Fall through to fallback parser
      }
    }

    // Robust fallback parser
    console.log('Using fallback parser for:', text);
    const items: ParsedItem[] = [];
    
    // Split text by various delimiters
    const lines = text.split(/[,;&\n]|(?:\s+and\s+)|(?:\s+&\s+)/i)
                     .map(line => line.trim())
                     .filter(line => line.length > 0);
    
    lines.forEach(line => {
      // Enhanced regex patterns for various formats
      const patterns = [
        // "2 lbs chicken", "3 cups flour"
        /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(?:of\s+)?(.+)$/i,
        // "chicken 2 lbs", "flour 3 cups"
        /^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/i,
        // "oil litres" (implies 1 litre)
        /^(.+?)\s+([a-zA-Z]+)$/i,
        // Just number and item "5 eggs"
        /^(\d+(?:\.\d+)?)\s+(.+)$/i,
        // Just item name "chicken"
        /^(.+)$/i
      ];
      
      for (let i = 0; i < patterns.length; i++) {
        const match = line.match(patterns[i]);
        if (!match) continue;
        
        let name: string, quantity: number, unit: string;
        
        switch (i) {
          case 0: // "2 lbs chicken"
            [, , , name] = match;
            quantity = parseFloat(match[1]);
            unit = match[2];
            break;
          case 1: // "chicken 2 lbs"
            [, name, , ] = match;
            quantity = parseFloat(match[2]);
            unit = match[3];
            break;
          case 2: // "oil litres"
            [, name, unit] = match;
            quantity = 1;
            break;
          case 3: // "5 eggs"
            [, , name] = match;
            quantity = parseFloat(match[1]);
            unit = 'pcs';
            break;
          case 4: // "chicken"
            [, name] = match;
            quantity = 1;
            unit = 'pcs';
            break;
          default:
            continue;
        }
        
        name = name.trim().toLowerCase();
        unit = unit || 'pcs';
        
        // Check if item exists in pantry
        const existingItem = existingItems.find((item: any) => 
          item.name.toLowerCase() === name
        );
        
        items.push({
          exists: !!existingItem,
          name: existingItem ? existingItem.name : capitalizeWords(name),
          quantity: isNaN(quantity) ? 1 : Math.max(0.1, quantity),
          unit: unit.trim(),
          category: guessCategory(name),
          purchaseDate: today
        });
        
        break; // Found a match, move to next line
      }
    });
    
    if (items.length === 0) {
      return NextResponse.json({
        items: [],
        warning: 'No items could be parsed. Try formats like: "2 lbs chicken, 3 eggs, 1 kg butter"'
      });
    }
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error parsing text:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse text', 
        details: error instanceof Error ? error.message : 'Unknown error',
        items: [] // Return empty array for graceful failure
      },
      { status: 500 }
    );
  }
}

function capitalizeWords(str: string): string {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function guessCategory(itemName: string): string {
  const name = itemName.toLowerCase();
  
  const categories: Record<string, string[]> = {
    'Vegetables': ['carrot', 'potato', 'onion', 'garlic', 'tomato', 'lettuce', 'spinach', 'broccoli', 'pepper', 'cucumber', 'celery', 'corn'],
    'Fruits': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'mango', 'pineapple', 'watermelon', 'peach', 'pear', 'lemon', 'lime'],
    'Meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'bacon', 'sausage', 'ham', 'steak', 'ground beef'],
    'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'cottage cheese'],
    'Grains': ['rice', 'bread', 'pasta', 'cereal', 'oat', 'flour', 'wheat', 'quinoa', 'barley'],
    'Seafood': ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'cod'],
    'Condiments': ['oil', 'vinegar', 'sauce', 'ketchup', 'mustard', 'mayonnaise', 'salt', 'pepper', 'spice'],
    'Beverages': ['juice', 'soda', 'water', 'tea', 'coffee', 'wine', 'beer'],
    'Snacks': ['chip', 'cookie', 'cracker', 'nut', 'candy', 'chocolate']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  return 'Uncategorized';
} 