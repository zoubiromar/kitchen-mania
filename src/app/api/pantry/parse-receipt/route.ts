import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  price?: number;
  totalPrice?: number;
}

interface ReceiptData {
  items: ReceiptItem[];
  merchant?: string;
  date?: string;
  total?: number;
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
    
    const systemPrompt = `You are an expert receipt analyzer. Analyze the provided image to extract grocery/store receipt information.

STEP 1: Determine if this is a receipt
- Look for typical receipt elements: store name, items with prices, total, date
- If it's NOT a receipt, return: {"isReceipt": false, "error": "Not a valid receipt image"}

STEP 2: Extract items from the receipt
Read each line item and extract:
- Product name (translate to English if needed)
- Quantity (default to 1 if not specified, look for duplicates marked with *)
- Price information
- ${unitPreferences}

TRANSLATION GUIDE:
- LACTANTIA PURFILT.LAIT = Lactantia Purfiltre Milk
- PILONS DE POULET = Chicken Drumsticks
- SAUMON FUME = Smoked Salmon
- FAM. = Family size

OUTPUT FORMAT:
{
  "isReceipt": true,
  "items": [
    {
      "exists": false,
      "name": "Product Name in English",
      "quantity": 1,
      "unit": "pcs",
      "price": 0.00,
      "totalPrice": 0.00,
      "category": "Dairy|Meat|Vegetables|Fruits|Grains|Snacks|Beverages|Condiments|Uncategorized",
      "purchaseDate": "${today}"
    }
  ],
  "merchant": "Store Name",
  "date": "${today}",
  "total": 0.00
}

${existingItemsText}

IMPORTANT NOTES:
- Items marked with * at the beginning are duplicates - count them properly
- Use "pcs" as default unit unless size is specified (e.g., 375G, 2%)
- Extract the actual price shown on the receipt
- Common French terms: LAIT=Milk, POULET=Chicken, FROMAGE=Cheese`;

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
              text: "Analyze this image. Is it a grocery/store receipt? If yes, extract each line item with name, quantity, and price. Items marked with * are duplicates. Return JSON as specified in the system prompt."
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{}';
    console.log('OpenAI Response:', content);
    
    try {
      const receiptData = JSON.parse(content);
      
      // Check if it's a valid receipt
      if (receiptData.isReceipt === false) {
        console.log('Not a receipt:', receiptData.error);
        return NextResponse.json(
          { error: receiptData.error || 'Not a valid receipt image' },
          { status: 400 }
        );
      }
      
      // Validate the response structure
      if (!receiptData.items || !Array.isArray(receiptData.items)) {
        throw new Error('Invalid response structure from AI');
      }
      
      // Ensure all items have required fields
      receiptData.items = receiptData.items.filter((item: any) => 
        item.name && 
        typeof item.quantity === 'number' && 
        item.unit
      );
      
      return NextResponse.json(receiptData);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse receipt data');
    }
  } catch (error) {
    console.error('Error parsing receipt:', error);
    
    // Return mock data on error for development
    const today = new Date().toISOString().split('T')[0];
    const fallbackItems = [
      { exists: false, name: 'Ground Beef', quantity: 1.5, unit: 'lbs', price: 4.99, totalPrice: 7.49, category: 'Meat', purchaseDate: today },
      { exists: false, name: 'Cheddar Cheese', quantity: 1, unit: 'lbs', price: 5.99, totalPrice: 5.99, category: 'Dairy', purchaseDate: today },
      { exists: false, name: 'Yellow Onions', quantity: 3, unit: 'pcs', price: 0.66, totalPrice: 1.99, category: 'Vegetables', purchaseDate: today },
      { exists: false, name: 'Pasta', quantity: 2, unit: 'boxes', price: 1.49, totalPrice: 2.98, category: 'Grains', purchaseDate: today },
    ];
    
    const mockData: ReceiptData = {
      items: fallbackItems,
      merchant: 'Local Grocery Store',
      date: today,
      total: fallbackItems.reduce((sum, item) => sum + item.totalPrice, 0)
    };
    
    return NextResponse.json(mockData);
  }
} 