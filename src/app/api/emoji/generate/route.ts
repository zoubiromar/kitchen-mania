import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Fallback emoji mapping
const emojiMap: Record<string, string> = {
  tomato: '🍅',
  tomatoes: '🍅',
  carrot: '🥕',
  carrots: '🥕',
  onion: '🧅',
  onions: '🧅',
  potato: '🥔',
  potatoes: '🥔',
  chicken: '🍗',
  beef: '🥩',
  pork: '🥓',
  fish: '🐟',
  rice: '🍚',
  bread: '🍞',
  cheese: '🧀',
  milk: '🥛',
  egg: '🥚',
  eggs: '🥚',
  apple: '🍎',
  apples: '🍎',
  banana: '🍌',
  bananas: '🍌',
  orange: '🍊',
  oranges: '🍊',
  lemon: '🍋',
  lemons: '🍋',
  pepper: '🌶️',
  peppers: '🌶️',
  corn: '🌽',
  broccoli: '🥦',
  lettuce: '🥬',
  cucumber: '🥒',
  garlic: '🧄',
  mushroom: '🍄',
  mushrooms: '🍄',
  peanut: '🥜',
  peanuts: '🥜',
  default: '🍽️'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemName } = body;

    if (!itemName) {
      return NextResponse.json(
        { error: 'Please provide an item name' },
        { status: 400 }
      );
    }

    // Check fallback mapping first
    const lowerName = itemName.toLowerCase();
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (lowerName.includes(key)) {
        return NextResponse.json({ emoji });
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      // Return default emoji if no API key
      return NextResponse.json({ emoji: emojiMap.default });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an emoji expert. Given a food or ingredient name, respond with ONLY the most appropriate single emoji that represents it. If it's not a food item, still try to find the most relevant emoji. Respond with just the emoji, nothing else."
        },
        {
          role: "user",
          content: itemName
        }
      ],
      max_tokens: 10,
      temperature: 0.3,
    });

    const emoji = completion.choices[0]?.message?.content?.trim() || emojiMap.default;
    
    // Validate that response is actually an emoji (basic check)
    if (emoji.length > 4) {
      return NextResponse.json({ emoji: emojiMap.default });
    }

    return NextResponse.json({ emoji });

  } catch (error) {
    console.error('Error generating emoji:', error);
    return NextResponse.json({ emoji: emojiMap.default });
  }
} 