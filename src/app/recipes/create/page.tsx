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
import { useAuth } from '@/components/AuthContext';
import { database } from '@/lib/database';
import { ProtectedRoute } from '@/components/AuthContext';
import { Toast, useToast } from '@/components/toast';
import { Badge } from '@/components/ui/badge';

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
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
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
  const [isSaving, setIsSaving] = useState(false);

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
    if (!recipe.title || recipe.ingredients.filter(ing => ing.name).length === 0) {
      showToast('Please add a title and at least one ingredient first', 'error');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/recipes/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recipe.title,
          ingredients: recipe.ingredients.filter(ing => ing.name).slice(0, 5).map(ing => ing.name)
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setRecipe(prev => ({ ...prev, image: data.imageUrl }));
      }
    } catch (error) {
      console.error('Error generating image:', error);
      showToast('Failed to generate image', 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRecipe(prev => ({ ...prev, image: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const saveRecipe = async () => {
    if (!recipe.title.trim()) {
      showToast('Please enter a recipe title', 'error');
      return;
    }

    if (!user) {
      showToast('Please log in to save recipes', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Filter out empty ingredients and instructions
      const validIngredients = recipe.ingredients.filter(ing => ing.name.trim());
      const validInstructions = recipe.instructions.filter(inst => inst.trim());

      if (validIngredients.length === 0) {
        showToast('Please add at least one ingredient', 'error');
        setIsSaving(false);
        return;
      }

      if (validInstructions.length === 0) {
        showToast('Please add at least one instruction', 'error');
        setIsSaving(false);
        return;
      }

      // Generate image if none exists
      let imageUrl = recipe.image;
      if (!imageUrl) {
        try {
          const imageResponse = await fetch('/api/recipes/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: recipe.title,
              ingredients: validIngredients.slice(0, 5).map(ing => ing.name)
            }),
          });
          const imageData = await imageResponse.json();
          imageUrl = imageData.imageUrl || `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(recipe.title)}`;
        } catch (error) {
          console.error('Error generating image:', error);
          imageUrl = `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(recipe.title)}`;
        }
      }

      const recipeData = {
        title: recipe.title,
        description: recipe.description || null,
        ingredients: validIngredients,
        instructions: validInstructions,
        servings: parseInt(recipe.servings),
        prep_time: recipe.prepTime ? parseInt(recipe.prepTime) : null,
        cook_time: null,
        difficulty: 'Medium' as const,
        rating: 0,
        image_url: imageUrl,
        unit_system: 'metric' as const
      };

      const { data, error } = await database.recipes.add(user.id, recipeData);
      
      if (error) throw error;
      
      if (data) {
        showToast('Recipe saved successfully!', 'success');
        router.push(`/recipes/${data.id}`);
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      showToast('Failed to save recipe. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
        
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
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Recipe Title *</Label>
                      <Input
                        id="title"
                        value={recipe.title}
                        onChange={(e) => setRecipe(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter recipe name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={recipe.description}
                        onChange={(e) => setRecipe(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of your recipe"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="servings">Servings</Label>
                        <Input
                          id="servings"
                          type="number"
                          min="1"
                          value={recipe.servings}
                          onChange={(e) => setRecipe(prev => ({ ...prev, servings: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                        <Input
                          id="prepTime"
                          type="number"
                          min="0"
                          value={recipe.prepTime}
                          onChange={(e) => setRecipe(prev => ({ ...prev, prepTime: e.target.value }))}
                          placeholder="30"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Image */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recipe Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recipe.image ? (
                      <div className="relative">
                        <Badge className="absolute top-2 right-2 z-10">Preview</Badge>
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `/api/placeholder/400/300?text=${encodeURIComponent(recipe.title)}`;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm text-gray-500 mb-3">
                            Upload an image or generate one with AI
                          </p>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="mb-3"
                          />
                          <p className="text-xs text-gray-500 mb-3">or</p>
                          <Button
                            onClick={generateImage}
                            disabled={isGeneratingImage || !recipe.title}
                            variant="outline"
                            className="w-full"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isGeneratingImage ? 'Generating...' : 'Generate with AI'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Ingredients & Instructions */}
              <div className="space-y-6">
                {/* Ingredients */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ingredients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recipe.ingredients.map((ingredient, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2">
                          <Input
                            className="col-span-6"
                            value={ingredient.name}
                            onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                            placeholder="Ingredient name"
                          />
                          <Input
                            className="col-span-2"
                            type="number"
                            step="0.1"
                            min="0"
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
                              variant="outline"
                              size="icon"
                              className="col-span-1"
                              onClick={() => removeIngredient(index)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addIngredient}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Ingredient
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recipe.instructions.map((instruction, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                            {index + 1}
                          </div>
                          <Textarea
                            value={instruction}
                            onChange={(e) => updateInstruction(index, e.target.value)}
                            placeholder={`Step ${index + 1}`}
                            rows={2}
                            className="flex-1"
                          />
                          {recipe.instructions.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeInstruction(index)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addInstruction}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Step
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-3">
                  <Button 
                    onClick={saveRecipe} 
                    className="w-full" 
                    size="lg"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Create Recipe'}
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
    </ProtectedRoute>
  );
} 