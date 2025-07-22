import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ReceiptItem {
  exists?: boolean;
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  totalPrice?: number;
  category?: string;
  purchaseDate?: string;
}

interface ReceiptData {
  items: ReceiptItem[];
  merchant?: string;
  date?: string;
  total?: number;
  isReceipt?: boolean; // Added for response validation
  error?: string; // Added for response validation
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, existingItems = [], unitSystem = 'imperial' } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Please provide an image in base64 format' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Fallback mock data for testing
      const today = new Date().toISOString().split('T')[0];
      const groceryItems = [
        { exists: false, name: 'Organic Chicken Breast', quantity: 2.5, unit: 'lbs', price: 5.99, totalPrice: 14.98, category: 'Meat', purchaseDate: today },
        { exists: false, name: 'Large Brown Eggs', quantity: 18, unit: 'pcs', price: 0.22, totalPrice: 3.99, category: 'Dairy', purchaseDate: today },
        { exists: false, name: 'Whole Milk', quantity: 1, unit: 'gallon', price: 3.49, totalPrice: 3.49, category: 'Dairy', purchaseDate: today },
        { exists: false, name: 'Roma Tomatoes', quantity: 2, unit: 'lbs', price: 2.49, totalPrice: 4.98, category: 'Vegetables', purchaseDate: today },
        { exists: false, name: 'Bananas', quantity: 6, unit: 'pcs', price: 0.29, totalPrice: 1.74, category: 'Fruits', purchaseDate: today },
        { exists: false, name: 'Sourdough Bread', quantity: 1, unit: 'pcs', price: 4.99, totalPrice: 4.99, category: 'Grains', purchaseDate: today },
        { exists: false, name: 'Greek Yogurt', quantity: 2, unit: 'pcs', price: 3.99, totalPrice: 7.98, category: 'Dairy', purchaseDate: today },
        { exists: false, name: 'Baby Spinach', quantity: 1, unit: 'bag', price: 2.99, totalPrice: 2.99, category: 'Vegetables', purchaseDate: today },
      ];
      
      // Check if any match existing items
      groceryItems.forEach(item => {
        const existing = existingItems?.find((e: any) => 
          e.name.toLowerCase() === item.name.toLowerCase()
        );
        if (existing) {
          item.exists = true;
          item.name = existing.name;
        }
      });
      
      const merchants = ['Whole Foods Market', 'Trader Joe\'s', 'Walmart', 'Kroger', 'Safeway', 'Target'];
      const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
      
      // Randomly select 4-6 items
      const numItems = Math.floor(Math.random() * 3) + 4;
      const selectedItems = groceryItems.sort(() => 0.5 - Math.random()).slice(0, numItems);
      const total = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      const mockData: ReceiptData = {
        items: selectedItems,
        merchant: randomMerchant,
        date: new Date().toISOString().split('T')[0],
        total: Math.round(total * 100) / 100
      };
      
      return NextResponse.json(mockData);
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const existingItemsText = existingItems?.length > 0 
      ? `\n\nExisting pantry items for matching:\n${existingItems.map((item: any) => item.name).join(', ')}`
      : '';

    const today = new Date().toISOString().split('T')[0];

    const unitPreferences = unitSystem === 'metric'
      ? 'Use metric units when units are ambiguous: kg, g for weight; liters, ml for volume'
      : 'Use imperial units when units are ambiguous: lbs, oz for weight; cups, fl oz for volume';
    
    const systemPrompt = `You are an expert receipt analyzer. Your task is to extract ALL items from a grocery/store receipt.

CRITICAL INSTRUCTIONS:
1. Extract EVERY SINGLE LINE ITEM from the receipt - do not skip any!
2. Look carefully at the entire image, from top to bottom
3. If you see multiple items, you MUST list them all in the items array
4. Each product line on the receipt = one item in your response

STEP 1: Receipt Validation
- Check for: store name, items with prices, total, date
- If NOT a receipt: {"isReceipt": false, "error": "Not a valid receipt image"}

STEP 2: Item Extraction Rules
For EACH line item on the receipt:
- Product name (translate to English if needed)
- Quantity (look for qty indicators like "2@", "*2", or duplicate lines)
- Unit price (price per item)
- Total price (quantity × unit price)
- Default unit: "pcs" unless size specified (e.g., 375G → "g", 2L → "L")
- ${unitPreferences}

COMMON PATTERNS:
- "ITEM NAME     $X.XX" = 1 item at X.XX
- "*ITEM NAME    $X.XX" = duplicate of previous item
- "ITEM NAME 2@$X.XX $Y.YY" = 2 items at X.XX each, total Y.YY
- "ITEM NAME 375G  $X.XX" = 375g package

TRANSLATION EXAMPLES:
- LACTANTIA PURFILT.LAIT = Lactantia Purfiltre Milk
- PILONS DE POULET = Chicken Drumsticks  
- SAUMON FUME = Smoked Salmon
- OEUFS = Eggs
- PAIN = Bread
- BEURRE = Butter
- FROMAGE = Cheese

OUTPUT FORMAT (return ONLY valid JSON):
{
  "isReceipt": true,
  "items": [
    {
      "exists": false,
      "name": "Product Name",
      "quantity": 1,
      "unit": "pcs",
      "price": 0.00,
      "totalPrice": 0.00,
      "category": "Category",
      "purchaseDate": "${today}"
    }
  ],
  "merchant": "Store Name",
  "date": "${today}",
  "total": 0.00
}

CATEGORIES: Dairy, Meat, Vegetables, Fruits, Grains, Snacks, Beverages, Condiments, Seafood, Uncategorized

${existingItemsText}

REMEMBER: Extract EVERY item visible on the receipt. If you see 10 items, return 10 items. Missing items is an error!`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this receipt image and extract ALL items. Return the data in the exact JSON format specified."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    console.log('OpenAI Response:', content);
    
    try {
      // Clean the response
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const receiptData = JSON.parse(cleanContent) as ReceiptData;
      
      // Validate response
      if (!receiptData.isReceipt) {
        return NextResponse.json(receiptData, { status: 400 });
      }
      
      // Ensure items array exists and has proper structure
      if (!Array.isArray(receiptData.items)) {
        throw new Error('Invalid response: items must be an array');
      }
      
      // Validate and clean each item
      receiptData.items = receiptData.items.map(item => ({
        exists: item.exists || false,
        name: item.name || 'Unknown Item',
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        unit: item.unit || 'pcs',
        price: typeof item.price === 'number' ? item.price : 0,
        totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : (item.price || 0) * (item.quantity || 1),
        category: item.category || 'Uncategorized',
        purchaseDate: item.purchaseDate || today
      }));
      
      // Log the number of items found
      console.log(`Receipt processed: ${receiptData.items.length} items found from ${receiptData.merchant || 'Unknown Store'}`);
      
      return NextResponse.json(receiptData);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse receipt data. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in receipt parsing:', error);
    
    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process receipt image', 
        details: error instanceof Error ? error.message : 'Unknown error',
        isReceipt: false
      },
      { status: 500 }
    );
  }
} 

// New endpoint for matching extracted items with pantry
export async function PUT(request: NextRequest) {
  try {
    const { extractedItems, existingItems } = await request.json();
    
    if (!extractedItems || !Array.isArray(extractedItems)) {
      return NextResponse.json(
        { error: 'Invalid request: extractedItems array required' },
        { status: 400 }
      );
    }
    
    const matchedItems = extractedItems.map((extracted: any) => {
      // Find close matches in existing items
      const normalizedName = extracted.name.toLowerCase().trim();
      
      // Look for exact match first
      let match = existingItems?.find((existing: any) => 
        existing.name.toLowerCase().trim() === normalizedName
      );
      
      // If no exact match, look for partial matches
      if (!match) {
        match = existingItems?.find((existing: any) => {
          const existingNorm = existing.name.toLowerCase().trim();
          
          // Split into words for better matching
          const extractedWords = normalizedName.split(/\s+/).filter((w: string) => w.length > 2);
          const existingWords = existingNorm.split(/\s+/).filter((w: string) => w.length > 2);
          
          // Count matching words (ignoring order)
          const matchingWords = extractedWords.filter((word: string) => 
            existingWords.some((existingWord: string) => 
              existingWord.includes(word) || word.includes(existingWord)
            )
          );
          
          // If most words match, it's likely the same item
          const matchRatio = matchingWords.length / Math.max(extractedWords.length, existingWords.length);
          if (matchRatio >= 0.7) {
            // Check blacklist to avoid false positives
            const blacklistPairs = [
              ['olive', 'vegetable'],
              ['coconut', 'vegetable'],
              ['butter', 'margarine'],
              ['cream', 'milk'],
              ['salmon', 'tuna'],
              ['chicken', 'beef'],
              ['pork', 'beef'],
            ];
            
            // Check blacklist
            for (const [word1, word2] of blacklistPairs) {
              if ((normalizedName.includes(word1) && existingNorm.includes(word2)) ||
                  (normalizedName.includes(word2) && existingNorm.includes(word1))) {
                return false;
              }
            }
            
            return true;
          }
          
          // Fallback to original logic for shorter items
          return (normalizedName.includes(existingNorm) || 
                  existingNorm.includes(normalizedName)) &&
                 Math.abs(normalizedName.length - existingNorm.length) < 10;
        });
      }
      
      if (match) {
        // Use existing item's properties but keep new quantity and price
        return {
          ...extracted,
          exists: true,
          existingId: match.id,
          name: match.name,
          emoji: match.emoji,
          category: match.category,
          unit: match.unit,
          // Keep the extracted quantity and price
          quantity: extracted.quantity,
          price: extracted.price,
          totalPrice: extracted.totalPrice
        };
      }
      
      return {
        ...extracted,
        exists: false
      };
    });
    
    return NextResponse.json({ items: matchedItems });
  } catch (error) {
    console.error('Error matching items:', error);
    return NextResponse.json(
      { error: 'Failed to match items' },
      { status: 500 }
    );
  }
} 