'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Sparkles, Plus, Minus } from 'lucide-react';

interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  servings?: string;
  prepTime?: string;
  usageFromPantry: { itemId: string; quantity: number; unit: string }[];
  image?: string;
  rating?: number;
  tags?: string[];
  createdAt?: string;
}

export default function CreateRecipePage() {
  const router = useRouter();
  const [recipe, setRecipe] = useState({
    title: '',
    description: '',
    servings: '4',
    prepTime: '',
    ingredients: [{ name: '', quantity: 1, unit: 'pcs' }] as RecipeIngredient[],
    instructions: [''],
    image: ''
  });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const addIngredient = () => {
    setRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: 1, unit: 'pcs' }]
    }));
  };

  const removeIngredient = (index: number) => {
    setRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    setRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const addInstruction = () => {
    setRecipe(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    setRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const generateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/recipes/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: recipe.title,
          ingredients: recipe.ingredients.filter(ing => ing.name.trim()).slice(0, 5).map(ing => ing.name)
        }),
      });
      
      const data = await response.json();
      if (data.imageUrl) {
        setRecipe(prev => ({ ...prev, image: data.imageUrl }));
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setRecipe(prev => ({ ...prev, image: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveRecipe = () => {
    if (!recipe.title.trim()) {
      alert('Please enter a recipe title');
      return;
    }

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients.filter(ing => ing.name.trim()),
      instructions: recipe.instructions.filter(inst => inst.trim()),
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      image: recipe.image || `/api/placeholder/400/300?text=${encodeURIComponent(recipe.title)}`,
      rating: 0,
      tags: [],
      createdAt: new Date().toISOString(),
      usageFromPantry: []
    };

    // Save to localStorage
    const existingRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    existingRecipes.push(newRecipe);
    localStorage.setItem('savedRecipes', JSON.stringify(existingRecipes));

    // Redirect to the new recipe page
    router.push(`/recipes/${newRecipe.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/recipes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Recipes
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Create New Recipe</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Left Column - Recipe Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Recipe Title*</Label>
                    <Input
                      id="title"
                      value={recipe.title}
                                             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipe(prev => ({...prev, title: e.target.value}))}
                      placeholder="Enter recipe title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={recipe.description}
                                             onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRecipe(prev => ({...prev, description: e.target.value}))}
                      placeholder="Brief description of your recipe"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="servings">Servings</Label>
                      <Input
                        id="servings"
                        value={recipe.servings}
                        onChange={(e) => setRecipe(prev => ({...prev, servings: e.target.value}))}
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prepTime">Prep Time</Label>
                      <Input
                        id="prepTime"
                        value={recipe.prepTime}
                        onChange={(e) => setRecipe(prev => ({...prev, prepTime: e.target.value}))}
                        placeholder="30 minutes"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle>Ingredients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-3 text-center">Unit</div>
                    <div className="col-span-1"></div>
                  </div>
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <Input
                        className="col-span-6"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                        placeholder={`Ingredient ${index + 1}`}
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                      <Select
                        value={ingredient.unit}
                        onValueChange={(value) => updateIngredient(index, 'unit', value)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['pcs', 'cups', 'tbsp', 'tsp', 'lbs', 'kg', 'g', 'oz', 'ml', 'l'].map(unit => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {recipe.ingredients.length > 1 && (
                        <Button
                          className="col-span-1"
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addIngredient}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Ingredient
                  </Button>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recipe.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center mt-3">
                        {index + 1}
                      </div>
                      <Textarea
                        value={instruction}
                        onChange={(e) => updateInstruction(index, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        className="flex-1"
                        rows={2}
                      />
                      {recipe.instructions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeInstruction(index)}
                          className="mt-3"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInstruction}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Instruction
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Image */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recipe.image && (
                    <div className="aspect-[4/3] relative overflow-hidden rounded-lg">
                      <Image
                        src={recipe.image}
                        alt="Recipe preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Upload Image</Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>

                  <div className="text-center">
                    <span className="text-sm text-gray-500">or</span>
                  </div>

                  <Button
                    onClick={generateImage}
                    disabled={isGeneratingImage || !recipe.title.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isGeneratingImage ? 'Generating...' : 'Generate AI Image'}
                  </Button>
                  
                  {!recipe.title.trim() && (
                    <p className="text-xs text-gray-500 text-center">
                      Enter a title to generate an AI image
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button onClick={saveRecipe} className="w-full" size="lg">
                  Create Recipe
                </Button>
                <Link href="/recipes">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 