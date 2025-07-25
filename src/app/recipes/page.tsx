'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { ProtectedRoute, useAuth } from '@/components/AuthContext';
import { database } from '@/lib/database';
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
  ingredients: (string | RecipeIngredient)[];
  instructions: string[];
  servings?: string;
  prepTime?: string;
  usageFromPantry: { itemId: string; quantity: number; unit: string }[];
  image?: string;
  rating?: number;
  tags?: string[];
  createdAt?: string;
  usedQuantities?: { itemId: string; quantity: number; unit: string }[];
}

export default function RecipesPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecipes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: dbRecipes, error } = await database.recipes.getAll(user.id);
      if (error) throw error;
      
      const formattedRecipes = (dbRecipes || []).map(recipe => ({
        ...recipe,
        image: recipe.image_url,
        prepTime: recipe.prep_time ? `${recipe.prep_time} min` : undefined,
        servings: recipe.servings ? `${recipe.servings} servings` : undefined,
        tags: recipe.tags || []
      }));
      
      setRecipes(formattedRecipes);
      
      // Extract all unique tags
      const tags = new Set<string>();
      formattedRecipes.forEach((recipe: any) => {
        recipe.tags?.forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, [user]);

  // Refresh recipes when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadRecipes();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  useEffect(() => {
    let filtered = [...recipes];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.some(ing => 
        typeof ing === 'string' 
          ? ing.toLowerCase().includes(searchTerm.toLowerCase())
          : ing.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      );
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(recipe => recipe.tags?.includes(selectedTag));
    }

    // Sort
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredRecipes(filtered);
  }, [recipes, searchTerm, selectedTag, sortBy]);

  const updateRating = async (recipeId: string, newRating: number) => {
    if (!user) return;
    
    try {
      const { error } = await database.recipes.update(recipeId, user.id, { rating: newRating });
      if (error) throw error;
      
      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId ? { ...recipe, rating: newRating } : recipe
      );
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!user) return;
    
    try {
      // Find the recipe to get its image URL before deletion
      const recipeToDelete = recipes.find(r => r.id === recipeId);
      
      // Delete the recipe from database
      const { error } = await database.recipes.delete(recipeId, user.id);
      if (error) throw error;
      
      // Delete associated image if it exists and is stored in our storage
      if (recipeToDelete?.image && isStoredImage(recipeToDelete.image)) {
        console.log('Deleting recipe image:', recipeToDelete.image);
        const imageDeleted = await deleteStoredImage(recipeToDelete.image);
        if (imageDeleted) {
          console.log('Recipe image deleted successfully');
        } else {
          console.warn('Failed to delete recipe image');
        }
      }
      
      // Update local state
      setRecipes(recipes.filter(r => r.id !== recipeId));
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const StarRating = ({ rating, recipeId }: { rating: number; recipeId: string }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={(e) => {
              e.preventDefault();
              updateRating(recipeId, star);
            }}
            className="text-base hover:scale-110 transition-transform"
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

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-4">My Recipe Collection</h1>
          <p className="text-gray-600">Browse and manage your saved recipes</p>
        </div>
        <Link href="/recipes/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Recipe
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {allTags.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Newest First</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="title">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {recipes.length === 0 
                ? "You haven't saved any recipes yet." 
                : "No recipes match your search criteria."}
            </p>
            <Link href="/pantry">
              <Button>Go to Pantry</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="relative">
              <Link href={`/recipes/${recipe.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                  <div className="h-44 relative overflow-hidden">
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
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-2.5 pb-0.5">
                    <CardTitle className="line-clamp-1 text-base">{recipe.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2.5 pt-0 space-y-0.5">
                    <StarRating rating={recipe.rating || 0} recipeId={recipe.id} />
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 pt-0.5">
                        {recipe.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {recipe.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{recipe.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <CardDescription className="text-xs pt-0.5">
                      {recipe.servings && `${recipe.servings} • `}
                      {recipe.prepTime}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${recipe.title}"?`)) {
                    deleteRecipe(recipe.id);
                  }
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
} 