'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock, Users, Tag, Pencil, Sparkles, Plus, Minus } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { database } from '@/lib/database';
import { ProtectedRoute } from '@/components/AuthContext';
import { deleteStoredImage, isStoredImage } from '@/lib/imageStorage';

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
  usageFromPantry?: { itemId: string; quantity: number; unit: string }[];
  image?: string;
  image_url?: string;
  rating?: number;
  tags?: string[];
  createdAt?: string;
  created_at?: string;
  usedQuantities?: { itemId: string; quantity: number; unit: string }[];
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [newTag, setNewTag] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !params.id) return;
    
    const loadRecipe = async () => {
      setIsLoading(true);
      try {
        const { data: dbRecipe, error } = await database.recipes.getById(params.id as string, user.id);
        if (error) throw error;
        
        if (dbRecipe) {
          // Format the recipe data to match the expected structure
          const formattedRecipe: Recipe = {
            ...dbRecipe,
            image: dbRecipe.image_url || dbRecipe.image,
            prepTime: dbRecipe.prep_time ? `${dbRecipe.prep_time} min` : undefined,
            servings: dbRecipe.servings ? `${dbRecipe.servings} servings` : undefined,
            createdAt: dbRecipe.created_at || dbRecipe.createdAt,
            ingredients: Array.isArray(dbRecipe.ingredients) ? dbRecipe.ingredients : [],
            instructions: Array.isArray(dbRecipe.instructions) ? dbRecipe.instructions : [],
            tags: dbRecipe.tags || [],
            usageFromPantry: dbRecipe.usageFromPantry || []
          };
          setRecipe(formattedRecipe);
        } else {
          // Recipe not found, redirect to recipes page
          router.push('/recipes');
        }
      } catch (error) {
        console.error('Error loading recipe:', error);
        router.push('/recipes');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipe();
  }, [params.id, user, router]);

  const updateRating = async (newRating: number) => {
    if (!recipe || !user) return;
    
    try {
      const { error } = await database.recipes.update(recipe.id, user.id, { rating: newRating });
      if (error) throw error;
      
      const updatedRecipe = { ...recipe, rating: newRating };
      setRecipe(updatedRecipe);
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const addTag = async () => {
    if (!recipe || !newTag.trim() || !user) return;
    
    const updatedTags = [...(recipe.tags || []), newTag.trim()];
    
    try {
      const { error } = await database.recipes.update(recipe.id, user.id, { tags: updatedTags });
      if (error) throw error;
      
      const updatedRecipe = { ...recipe, tags: updatedTags };
      setRecipe(updatedRecipe);
      setNewTag('');
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    if (!recipe || !user) return;
    
    const updatedTags = recipe.tags?.filter(tag => tag !== tagToRemove) || [];
    
    try {
      const { error } = await database.recipes.update(recipe.id, user.id, { tags: updatedTags });
      if (error) throw error;
      
      const updatedRecipe = { ...recipe, tags: updatedTags };
      setRecipe(updatedRecipe);
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const startEditing = () => {
    if (recipe) {
      setEditingRecipe({ ...recipe });
    }
  };

  const cancelEditing = () => {
    setEditingRecipe(null);
  };

  const saveEdits = async () => {
    if (!editingRecipe || !recipe || !user) return;

    try {
      // Check if image URL has changed and delete old image if it's a stored image
      const oldImageUrl = recipe.image;
      const newImageUrl = editingRecipe.image;
      
      if (oldImageUrl && oldImageUrl !== newImageUrl && isStoredImage(oldImageUrl)) {
        console.log('Deleting old image:', oldImageUrl);
        const deleted = await deleteStoredImage(oldImageUrl);
        if (deleted) {
          console.log('Old image deleted successfully');
        } else {
          console.warn('Failed to delete old image');
        }
      }

      // Prepare data for database update
      const updates = {
        title: editingRecipe.title,
        description: editingRecipe.description || null,
        ingredients: editingRecipe.ingredients,
        instructions: editingRecipe.instructions,
        servings: editingRecipe.servings ? parseInt(editingRecipe.servings.replace(/\D/g, '')) : undefined,
        prep_time: editingRecipe.prepTime ? parseInt(editingRecipe.prepTime.replace(/\D/g, '')) : null,
        image_url: editingRecipe.image,
        tags: editingRecipe.tags || []
      };
      
      const { error } = await database.recipes.update(recipe.id, user.id, updates);
      if (error) throw error;
      
      setRecipe(editingRecipe);
      setEditingRecipe(null);
    } catch (error) {
      console.error('Error saving edits:', error);
    }
  };

  const generateNewImage = async () => {
    if (!editingRecipe) return;

    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/recipes/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingRecipe.title,
          ingredients: editingRecipe.ingredients.slice(0, 5).map(ing => 
            typeof ing === 'string' ? ing : ing.name
          )
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setEditingRecipe({ ...editingRecipe, image: data.imageUrl });
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingRecipe) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditingRecipe({ ...editingRecipe, image: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => updateRating(star)}
            className="text-2xl hover:scale-110 transition-transform"
          >
            {star <= (rating || 0) ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Recipe not found</p>
            <Link href="/recipes">
              <Button className="mt-4">Back to Recipes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header Image */}
        <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden bg-gray-200">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `/api/placeholder/400/300?text=${encodeURIComponent(recipe.title)}`;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500 text-xl">No image available</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back button */}
          <Link href="/recipes">
            <Button
              variant="outline"
              className="absolute top-4 left-4 bg-white/90 hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
            </Button>
          </Link>
          
          {/* Edit button */}
          <Button
            onClick={startEditing}
            variant="outline"
            className="absolute top-4 right-4 bg-white/90 hover:bg-white"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Recipe
          </Button>
          
          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{recipe.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              {recipe.servings && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {recipe.servings}
                </div>
              )}
              {recipe.prepTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {recipe.prepTime}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Rating */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <StarRating rating={recipe.rating || 0} />
            </CardContent>
          </Card>

          {/* Description */}
          {recipe.description && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{recipe.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
              <CardDescription>
                Add tags to organize your recipes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.tags?.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => editingTags && removeTag(tag)}
                  >
                    {tag}
                    {editingTags && ' ×'}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1"
                />
                <Button onClick={addTag} size="sm">
                  Add Tag
                </Button>
                <Button
                  onClick={() => setEditingTags(!editingTags)}
                  variant="outline"
                  size="sm"
                >
                  {editingTags ? 'Done' : 'Edit'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
                <CardDescription>
                  Everything you need to make this recipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Ingredient</th>
                        <th className="text-center py-2">Qty</th>
                        <th className="text-center py-2">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipe.ingredients && recipe.ingredients.map((ingredient, idx) => {
                        const ing = typeof ingredient === 'string' 
                          ? { name: ingredient, quantity: 1, unit: 'pcs' }
                          : ingredient;
                        return (
                          <tr key={idx} className="border-b">
                            <td className="py-2">{ing.name}</td>
                            <td className="text-center py-2">{ing.quantity}</td>
                            <td className="text-center py-2">{ing.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
                <CardDescription>
                  Step-by-step cooking guide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {recipe.instructions && recipe.instructions.map((instruction, idx) => (
                    <li key={idx} className="flex">
                      <span className="font-semibold text-blue-600 mr-3 flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Additional info */}
          {recipe.createdAt && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Saved on {new Date(recipe.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Edit Recipe Dialog */}
        {editingRecipe && (
          <Dialog open={!!editingRecipe} onOpenChange={() => setEditingRecipe(null)}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Recipe</DialogTitle>
                <DialogDescription>
                  Edit your recipe details including title, ingredients, instructions, and image
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  {/* Title Section - Full Width */}
                  <div>
                    <Label htmlFor="editTitle">Title</Label>
                    <Input
                      id="editTitle"
                      value={editingRecipe.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setEditingRecipe({...editingRecipe, title: e.target.value})
                      }
                    />
                  </div>
                  
                  {/* Recipe Image Section - Full Width */}
                  <div>
                    <Label>Recipe Image</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editingRecipe.image && (
                        <div className="aspect-[4/3] relative overflow-hidden rounded-lg">
                          <img
                            src={editingRecipe.image}
                            alt="Recipe preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `/api/placeholder/400/300?text=${encodeURIComponent(editingRecipe.title)}`;
                            }}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="text-xs"
                        />
                        <p className="text-xs text-gray-500 text-center">or</p>
                        <Button
                          onClick={generateNewImage}
                          disabled={isGeneratingImage}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {isGeneratingImage ? 'Generating...' : 'Generate New AI Image'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editingRecipe.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setEditingRecipe({...editingRecipe, description: e.target.value})
                    }
                    rows={3}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editServings">Servings</Label>
                    <Input
                      id="editServings"
                      value={editingRecipe.servings || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setEditingRecipe({...editingRecipe, servings: e.target.value})
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPrepTime">Prep Time</Label>
                    <Input
                      id="editPrepTime"
                      value={editingRecipe.prepTime || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setEditingRecipe({...editingRecipe, prepTime: e.target.value})
                      }
                    />
                  </div>
                </div>

                {/* Ingredients Section */}
                <div>
                  <Label>Ingredients</Label>
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold">
                      <div className="col-span-7">Name</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-center">Unit</div>
                      <div className="col-span-1"></div>
                    </div>
                    {editingRecipe.ingredients && editingRecipe.ingredients.map((ingredient, index) => {
                      const ing = typeof ingredient === 'string' 
                        ? { name: ingredient, quantity: 1, unit: 'pcs' }
                        : ingredient;
                      return (
                        <div key={index} className="grid grid-cols-12 gap-2">
                          <Input
                            className="col-span-7"
                            value={ing.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newIngredients = [...editingRecipe.ingredients];
                              newIngredients[index] = {
                                ...ing,
                                name: e.target.value
                              };
                              setEditingRecipe({...editingRecipe, ingredients: newIngredients});
                            }}
                            placeholder="Ingredient name"
                          />
                          <Input
                            className="col-span-2"
                            type="number"
                            step="0.1"
                            value={ing.quantity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newIngredients = [...editingRecipe.ingredients];
                              newIngredients[index] = {
                                ...ing,
                                quantity: parseFloat(e.target.value) || 0
                              };
                              setEditingRecipe({...editingRecipe, ingredients: newIngredients});
                            }}
                          />
                          <Select
                            value={ing.unit}
                            onValueChange={(value: string) => {
                              const newIngredients = [...editingRecipe.ingredients];
                              newIngredients[index] = {
                                ...ing,
                                unit: value
                              };
                              setEditingRecipe({...editingRecipe, ingredients: newIngredients});
                            }}
                          >
                            <SelectTrigger className="col-span-2">
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
                          {editingRecipe.ingredients.length > 1 && (
                            <Button
                              className="col-span-1"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newIngredients = editingRecipe.ingredients.filter((_, i) => i !== index);
                                setEditingRecipe({...editingRecipe, ingredients: newIngredients});
                              }}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingRecipe({
                          ...editingRecipe,
                          ingredients: [...(editingRecipe.ingredients || []), { name: '', quantity: 1, unit: 'pcs' }]
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Ingredient
                    </Button>
                  </div>
                </div>

                {/* Instructions Section */}
                <div>
                  <Label>Instructions</Label>
                  <div className="space-y-2 mt-2">
                    {editingRecipe.instructions && editingRecipe.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center mt-3">
                          {index + 1}
                        </div>
                        <Textarea
                          value={instruction}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            const newInstructions = [...editingRecipe.instructions];
                            newInstructions[index] = e.target.value;
                            setEditingRecipe({...editingRecipe, instructions: newInstructions});
                          }}
                          rows={3}
                          className="flex-1"
                        />
                        {editingRecipe.instructions.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newInstructions = editingRecipe.instructions.filter((_, i) => i !== index);
                              setEditingRecipe({...editingRecipe, instructions: newInstructions});
                            }}
                            className="mt-3"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingRecipe({
                          ...editingRecipe,
                          instructions: [...(editingRecipe.instructions || []), '']
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Instruction
                    </Button>
                  </div>
                </div>

              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={saveEdits} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedRoute>
  );
} 