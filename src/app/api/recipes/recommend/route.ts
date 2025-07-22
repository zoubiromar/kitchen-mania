import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface PantryIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mustUseIngredients = [], availableIngredients = [], numberOfPeople = 4, userPreference = '', unitSystem = 'imperial' } = body;

    if (!availableIngredients || !Array.isArray(availableIngredients) || availableIngredients.length === 0) {
      return NextResponse.json(
        { error: 'Please provide a list of available ingredients' },
        { status: 400 }
      );
    }

    const pantryIngredients: PantryIngredient[] = availableIngredients;
    const mustUse: PantryIngredient[] = mustUseIngredients;

    if (!process.env.OPENAI_API_KEY) {
      // Fallback response when OpenAI API key is not configured
      const mainIngredient = mustUse.length > 0 ? mustUse[0] : pantryIngredients[0];
      
      return NextResponse.json({
        recipes: [
          {
            title: `Simple ${mainIngredient.name} Recipe`,
            description: `A delicious and easy recipe featuring ${mainIngredient.name}`,
            servings: numberOfPeople.toString(),
            prepTime: '20 minutes',
            ingredients: [
              {
                name: mainIngredient.name,
                quantity: Math.ceil(mainIngredient.quantity * numberOfPeople / 4),
                unit: mainIngredient.unit
              },
              ...mustUse.slice(1).map(ing => ({
                name: ing.name,
                quantity: Math.ceil(ing.quantity * numberOfPeople / 4),
                unit: ing.unit
              })),
              { name: 'olive oil', quantity: 2, unit: 'tbsp' },
              { name: 'salt and pepper', quantity: 1, unit: 'to taste' }
            ],
            instructions: [
              'Prepare all ingredients according to recipe requirements',
              'Heat oil in a large pan over medium heat',
              'Cook ingredients according to their cooking times',
              'Season with salt and pepper',
              'Serve hot and enjoy!'
            ],
            usageFromPantry: [
              { itemId: mainIngredient.id, quantity: Math.ceil(mainIngredient.quantity * numberOfPeople / 4), unit: mainIngredient.unit },
              ...mustUse.slice(1).map(ing => ({
                itemId: ing.id, 
                quantity: Math.ceil(ing.quantity * numberOfPeople / 4), 
                unit: ing.unit
              }))
            ]
          }
        ]
      });
    }

    const availableList = pantryIngredients.map(ing => 
      `${ing.quantity} ${ing.unit} ${ing.name} (ID: ${ing.id})`
    ).join(', ');
    
    const mustUseList = mustUse.map(ing => 
      `${ing.quantity} ${ing.unit} ${ing.name} (ID: ${ing.id})`
    ).join(', ');
    
    const unitPreferences = unitSystem === 'metric' 
      ? 'Use metric units: kg, g for weight; liters, ml for liquids; celsius for temperature'
      : 'Use imperial units: lbs, oz for weight; cups, fl oz for liquids; fahrenheit for temperature';
    
    const systemPrompt = `You are a helpful chef assistant. Create 2-3 delicious, well-balanced recipes for ${numberOfPeople} people.

IMPORTANT GUIDELINES:
- Focus on creating GOOD, TASTY meals - quality over quantity of ingredients used
- DO NOT force using all available ingredients if they don't fit well together
- Only use ingredients that naturally complement each other
- You can suggest simple recipes that use just a few ingredients if that makes a better dish
- Consider classic flavor combinations and cooking traditions
- ${unitPreferences}
${mustUse.length > 0 ? `\n- These specific ingredients MUST be used: ${mustUseList}` : ''}
${userPreference ? `\n- User preference: "${userPreference}"` : ''}

Available pantry ingredients: ${availableList}

For each recipe, provide:
1. A clear title
2. A brief description (1-2 sentences)
3. Number of servings (exactly ${numberOfPeople})
4. Prep time
5. Complete list of ingredients (properly scaled)
6. Step-by-step instructions (4-8 steps)
7. usageFromPantry array showing which pantry items are used

CRITICAL FORMATTING RULES:
- You MUST respond with ONLY valid JSON, no other text
- Start your response with { and end with }
- Your response must be a JSON object with a "recipes" array
- Instructions MUST be an array of strings, NOT a single string
- Each instruction should be a complete sentence
- Do NOT use any markdown formatting or code blocks

Format your response EXACTLY like this example:
{
  "recipes": [{
    "title": "Recipe Name",
    "description": "Brief recipe description",
    "servings": "${numberOfPeople}",
    "prepTime": "30 minutes",
    "ingredients": [
      {"name": "flour", "quantity": 2, "unit": "cups"},
      {"name": "eggs", "quantity": 3, "unit": "pcs"}
    ],
    "instructions": [
      "First, prepare all ingredients",
      "Next, mix the dry ingredients",
      "Then add wet ingredients",
      "Finally, cook and serve"
    ],
    "usageFromPantry": [{"itemId": "id", "quantity": 2, "unit": "cups"}]
  }]
}

CRITICAL INGREDIENT RULES:
- Each ingredient MUST be an object with name, quantity, and unit fields
- The "name" field should contain ONLY the ingredient name (e.g., "Tomatoes", NOT "3 Tomatoes")
- The "quantity" field should contain the numeric amount
- The "unit" field should contain the unit of measurement (pcs, cups, lbs, etc.)
- DO NOT include quantities or numbers in the ingredient name field

Scale all quantities appropriately for ${numberOfPeople} servings. The usageFromPantry should match the ingredient IDs provided and specify exact quantities to deduct from the pantry.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Available ingredients: ${availableList}${mustUse.length > 0 ? `. Must use: ${mustUseList}` : ''}. Please suggest ${numberOfPeople}-serving recipes.`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const aiResponse = completion.choices[0]?.message?.content || '{}';
    console.log('AI Response:', aiResponse);
    
    try {
      // Clean the response - remove any markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // If the response is wrapped in an object, extract the recipes array
      const parsedData = JSON.parse(cleanedResponse);
      
      // Extract recipes array from the response
      let recipes = parsedData.recipes || [];
      
      // Ensure recipes is an array
      if (!Array.isArray(recipes)) {
        throw new Error('Invalid response format: recipes must be an array');
      }
      
      // Validate and clean each recipe
      recipes = recipes.map((recipe: any) => {
        // Ensure instructions is an array of strings
        let instructions = recipe.instructions;
        if (typeof instructions === 'string') {
          // Split by common delimiters if it's a single string
          instructions = instructions.split(/\d+\.\s*|\n/).filter((s: string) => s.trim());
        } else if (!Array.isArray(instructions)) {
          instructions = ['Prepare and cook according to standard methods'];
        }
        
        // Ensure all required fields exist
        return {
          title: recipe.title || 'Untitled Recipe',
          description: recipe.description || 'A delicious recipe from your pantry',
          servings: recipe.servings || numberOfPeople.toString(),
          prepTime: recipe.prepTime || '30 minutes',
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
          instructions: instructions.map((inst: any) => String(inst).trim()),
          usageFromPantry: Array.isArray(recipe.usageFromPantry) ? recipe.usageFromPantry : []
        };
      });
      
      return NextResponse.json({ recipes });
    } catch (parseError) {
      console.error('Parse error:', parseError);
      console.error('Raw AI response:', aiResponse);
      
      // Return a simple error response
      return NextResponse.json({
        error: 'Failed to parse recipe data. Please try again.',
        recipes: []
      });
    }

  } catch (error) {
    console.error('Error generating recipe recommendations:', error);
    
    return NextResponse.json({
      recipes: [{
        title: 'Simple Pantry Meal',
        servings: '4',
        prepTime: '20 minutes',
        ingredients: ['Your pantry items', 'Salt and pepper to taste'],
        instructions: [
          'Prepare your ingredients',
          'Cook according to your preference',
          'Season to taste',
          'Serve and enjoy!'
        ],
        usageFromPantry: []
      }]
    });
  }
} 