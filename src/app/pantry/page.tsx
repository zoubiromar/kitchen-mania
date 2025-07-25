'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ChevronDown, Pencil, ChefHat, Camera, Minus, Sparkles, BookOpen, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProtectedRoute, useAuth } from '@/components/AuthContext';
import { saveReceiptData } from '@/utils/localStorage';
import { database } from '@/lib/database';
import { Toast, useToast } from '@/components/toast';
import { supabase } from '@/lib/supabase';
import { areUnitsCompatible, addQuantitiesWithConversion, getBestDisplayUnit } from '@/utils/unitConversion';

interface PantryItem {
  id: string;
  name: string;
  emoji?: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  purchaseDate?: string;
}

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
  usedQuantities?: { itemId: string; quantity: number; unit: string; originalItem?: PantryItem }[];
}

const commonEmojis = ['🍅', '🥕', '🧅', '🥔', '🌽', '🥦', '🥬', '🥒', '🌶️', '🫑', '🥑', '🍆', '🧄', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧈', '🍳', '🥚', '🧀', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥙', '🌮', '🌯', '��', '8', '🍝', '🍜', '🍲', '🍛', '🍱', '🍚', '🍙', '🍘', '🍥', '🍣', '🍤', '🦪', '🦑', '🦐', '🦞', '🦀', '🐙', '🍠', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥨', '🥕', '🌶️', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🍕', '🌭', '🍔', '🥙', '🌮', '🌯', '🍜', '🍝', '🍛', '🍲', '🍱', '🍘', '🍙', '🍚', '🍢', '🍣', '🍤', '🦐', '🦑', '🦪', '🍰', '🧁', '🥧', '🍦', '🍨', '🍧', '🍬', '🍭', '🍫', '🍿', '🥤', '🧃', '🥛', '☕', '🍵', '🧉', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧊'];

const standardUnits = [
  'pcs', 'lbs', 'kg', 'g', 'oz', 'cups', 'tbsp', 'tsp', 'ml', 'l', 'fl oz', 'pt', 'qt', 'gal',
  'dozen', 'bunch', 'bag', 'box', 'can', 'jar', 'bottle', 'package', 'slice', 'clove', 'head', 'stalk'
];

// Helper function to guess emoji based on item name
const guessEmojiForItem = (itemName: string): string => {
  const name = itemName.toLowerCase();
  const emojiMap: Record<string, string> = {
    // Fruits
    'apple': '🍎', 'banana': '🍌', 'orange': '🍊', 'grape': '🍇', 'strawberry': '🍓',
    'cherry': '🍒', 'peach': '🍑', 'pear': '🍐', 'pineapple': '🍍', 'mango': '🥭',
    'watermelon': '🍉', 'melon': '🍈', 'lemon': '🍋', 'avocado': '🥑',
    // Vegetables
    'tomato': '🍅', 'carrot': '🥕', 'corn': '🌽', 'potato': '🥔', 'onion': '🧅',
    'garlic': '🧄', 'broccoli': '🥦', 'cucumber': '🥒', 'lettuce': '🥬', 'pepper': '🌶️',
    'mushroom': '🍄', 'eggplant': '🍆',
    // Meat & Protein
    'chicken': '🍗', 'beef': '🥩', 'pork': '🥓', 'bacon': '🥓', 'egg': '🥚',
    'fish': '🐟', 'shrimp': '🦐', 'steak': '🥩', 'meat': '🍖',
    // Dairy
    'milk': '🥛', 'cheese': '🧀', 'butter': '🧈', 'yogurt': '🥛', 'cream': '🥛',
    // Grains & Baked
    'bread': '🍞', 'rice': '🍚', 'pasta': '🍝', 'noodle': '🍜', 'cereal': '🥣',
    'cookie': '🍪', 'cake': '🍰', 'donut': '🍩', 'croissant': '🥐',
    // Beverages
    'coffee': '☕', 'tea': '🍵', 'juice': '🧃', 'soda': '🥤', 'water': '💧',
    'wine': '🍷', 'beer': '🍺',
    // Other
    'honey': '🍯', 'salt': '🧂', 'sugar': '🍬', 'oil': '🫗', 'chocolate': '🍫',
    'ice cream': '🍦', 'pizza': '🍕', 'burger': '🍔', 'sandwich': '🥪', 'soup': '🍲'
  };
  
  // Check if item name contains any of the keywords
  for (const [keyword, emoji] of Object.entries(emojiMap)) {
    if (name.includes(keyword)) {
      return emoji;
    }
  }
  
  // Default emojis by category keywords
  if (name.includes('fruit')) return '🍎';
  if (name.includes('vegetable') || name.includes('veggie')) return '🥕';
  if (name.includes('meat')) return '🥩';
  if (name.includes('dairy')) return '🥛';
  if (name.includes('grain')) return '🌾';
  
  return '📦'; // Default emoji
};

export default function PantryPage() {
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [newItem, setNewItem] = useState({
    name: '',
    emoji: '',
    quantity: 0,
    unit: '',
    category: '',
    expiryDate: '',
    purchaseDate: ''
  });
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isGettingRecommendations, setIsGettingRecommendations] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<PantryItem | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [generatingEmoji, setGeneratingEmoji] = useState<string | null>(null);
  const [savingRecipe, setSavingRecipe] = useState<string | null>(null);
  const [selectedForRecipe, setSelectedForRecipe] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState<number>(2);
  const [usedRecipes, setUsedRecipes] = useState<Set<string>>(new Set());
  const [showBulkAdd, setShowBulkAdd] = useState<string | null>(null);
  const [userPreference, setUserPreference] = useState<string>('');
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkImage, setBulkImage] = useState<string | null>(null);
  const [showRecipePreference, setShowRecipePreference] = useState(false);
  const [bulkItems, setBulkItems] = useState<{new: PantryItem[], existing: {item: PantryItem, addQuantity: number}[]}>({new: [], existing: []});
  const [showUseSavedRecipe, setShowUseSavedRecipe] = useState(false);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('imperial');
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [tempReceiptData, setTempReceiptData] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [existingStores, setExistingStores] = useState<string[]>([]);

  // Get available units based on user preferences
  const getAvailableUnits = () => {
    if (!userProfile?.preferred_units || userProfile.preferred_units.length === 0) {
      return standardUnits;
    }
    // User's preferred units come first, then others
    const preferred = userProfile.preferred_units;
    const others = standardUnits.filter(unit => !preferred.includes(unit));
    return [...preferred, ...others];
  };

  // Helper to display quantity with best unit
  const displayQuantity = (quantity: number, unit: string) => {
    const best = getBestDisplayUnit(quantity, unit);
    return `${best.quantity} ${best.unit}`;
  };

  // Load user data from database
  useEffect(() => {
    if (!user) return;
    
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Load user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
          setUnitSystem(profile.unit_system || 'metric');
        }
        
        // Load pantry items
        const { data: items, error } = await database.pantry.getAll(user.id);
        if (error) throw error;
        
        // Load existing stores from price tracker
        try {
          const { data: priceData } = await database.priceTracker.getAll(user.id);
          if (priceData) {
            const stores = new Set<string>();
            priceData.forEach((item: any) => {
              if (item.stores && Array.isArray(item.stores)) {
                item.stores.forEach((store: any) => {
                  if (store.store) stores.add(store.store);
                });
              }
            });
            setExistingStores(Array.from(stores).sort());
          }
        } catch (error) {
          console.error('Failed to load stores:', error);
        }
        
        // If user has no items, add some default items
        if (!items || items.length === 0) {
          const isMetric = profile?.unit_system === 'metric';
          const defaultItems = [
            { name: 'Milk', emoji: '🥛', quantity: 1, unit: isMetric ? 'L' : 'gal', category: 'Dairy' },
            { name: 'Eggs', emoji: '🥚', quantity: 12, unit: 'pcs', category: 'Dairy' },
            { name: 'Bread', emoji: '🍞', quantity: 1, unit: 'pcs', category: 'Grains' },
            { name: 'Butter', emoji: '🧈', quantity: 100, unit: 'g', category: 'Dairy' },
            { name: 'Tomatoes', emoji: '🍅', quantity: 6, unit: 'pcs', category: 'Vegetables' },
            { name: 'Onions', emoji: '🧅', quantity: 3, unit: 'pcs', category: 'Vegetables' },
            { name: 'Chicken', emoji: '🍗', quantity: isMetric ? 1 : 2, unit: isMetric ? 'kg' : 'lbs', category: 'Meat' },
            { name: 'Rice', emoji: '🍚', quantity: isMetric ? 2 : 4, unit: isMetric ? 'kg' : 'lbs', category: 'Grains' },
            { name: 'Pasta', emoji: '🍝', quantity: isMetric ? 500 : 1, unit: isMetric ? 'g' : 'lbs', category: 'Grains' },
            { name: 'Apples', emoji: '🍎', quantity: 6, unit: 'pcs', category: 'Fruits' }
          ];
          
          // Add default items to database
          const addedItems = [];
          for (const item of defaultItems) {
            try {
              const { data, error } = await database.pantry.add(user.id, {
                ...item,
                expiry_date: null,
                price: null
              });
              if (data && !error) {
                addedItems.push({
                  id: data.id,
                  name: data.name,
                  emoji: data.emoji,
                  quantity: data.quantity,
                  unit: data.unit,
                  category: data.category,
                  expiryDate: data.expiry_date,
                  purchaseDate: data.created_at
                });
              }
            } catch (err) {
              console.error('Error adding default item:', err);
            }
          }
          
          setPantryItems(addedItems);
          showToast('Welcome! We\'ve added some starter items to your pantry', 'success');
        } else {
          setPantryItems(items);
        }
        
        // Load saved recipes
        const { data: recipes } = await database.recipes.getAll(user.id);
        setSavedRecipes(recipes || []);
      } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const addItem = async () => {
    if (!user || !newItem.name || newItem.quantity <= 0) return;
    
    try {
      const itemData = {
        name: newItem.name,
        emoji: newItem.emoji || '📦',
        quantity: newItem.quantity,
        unit: newItem.unit || (unitSystem === 'metric' ? 'g' : 'pcs'),
        category: newItem.category || 'Other',
        expiry_date: newItem.expiryDate || null,
        price: null
      };
      
      const { data, error } = await database.pantry.add(user.id, itemData);
      if (error) throw error;
      
      if (data) {
        setPantryItems([...pantryItems, {
          id: data.id,
          name: data.name,
          emoji: data.emoji,
          quantity: data.quantity,
          unit: data.unit,
          category: data.category,
          expiryDate: data.expiry_date,
          purchaseDate: data.created_at
        }]);
        setNewItem({ name: '', emoji: '', quantity: 0, unit: '', category: '', expiryDate: '', purchaseDate: '' });
        showToast('Item added successfully', 'success');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      showToast('Failed to add item', 'error');
    }
  };

  const removeItem = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await database.pantry.delete(id, user.id);
      if (error) throw error;
      
      setPantryItems(pantryItems.filter(item => item.id !== id));
      showToast('Item removed', 'success');
    } catch (error) {
      console.error('Error removing item:', error);
      showToast('Failed to remove item', 'error');
    }
  };

  const removeCategory = async (category: string) => {
    if (!user) return;
    
    const itemsToRemove = pantryItems.filter(item => item.category === category);
    if (itemsToRemove.length === 0) return;
    
    try {
      // Remove all items in the category
      for (const item of itemsToRemove) {
        const { error } = await database.pantry.delete(item.id, user.id);
        if (error) throw error;
      }
      
      setPantryItems(pantryItems.filter(item => item.category !== category));
      showToast(`Removed ${itemsToRemove.length} items from ${category}`, 'success');
    } catch (error) {
      console.error('Error removing category:', error);
      showToast('Failed to remove category', 'error');
    }
  };

  const updateItem = async (id: string, updates: Partial<PantryItem>) => {
    if (!user) return;
    
    // First update local state immediately for better UX
    setPantryItems(pantryItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    
    try {
      const dbUpdates: any = {};
      if ('name' in updates) dbUpdates.name = updates.name;
      if ('emoji' in updates) dbUpdates.emoji = updates.emoji;
      if ('quantity' in updates) dbUpdates.quantity = updates.quantity;
      if ('unit' in updates) dbUpdates.unit = updates.unit;
      if ('category' in updates) dbUpdates.category = updates.category;
      if ('expiryDate' in updates) dbUpdates.expiry_date = updates.expiryDate;
      
      const { error } = await database.pantry.update(id, user.id, dbUpdates);
      if (error) {
        // Check if it's a "no rows" error (item doesn't exist or wrong user)
        const errorMessage = error.message || error.toString();
        if (errorMessage.includes('JSON object requested') || errorMessage.includes('no) rows returned')) {
          // Silently ignore - item might have been deleted elsewhere
          console.log('Item not found for update:', id);
        } else {
          // Revert local state on actual error
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error updating item:', error);
      // Revert the local state change
      const originalItem = pantryItems.find(item => item.id === id);
      if (originalItem) {
        setPantryItems(pantryItems);
      }
      showToast('Failed to update item', 'error');
    }
  };

  const toggleItemForRecipe = (itemId: string) => {
    const newSelected = new Set(selectedForRecipe);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedForRecipe(newSelected);
  };

  const processBulkText = async (text: string) => {
    if (!text.trim()) return;
    
    showToast('Processing items...', 'info');
    
    try {
      const response = await fetch('/api/pantry/parse-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          existingItems: pantryItems.map(item => ({
            name: item.name,
            category: item.category
          })),
          unitSystem: unitSystem
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse text');
      }
      
      if (data.items && data.items.length > 0) {
        const parsedItems: PantryItem[] = [];
        const updates: {item: PantryItem, addQuantity: number}[] = [];
        
        data.items.forEach((parsedItem: any) => {
          if (parsedItem.exists) {
            // Find the existing item with matching or compatible unit
            const existingItem = pantryItems.find(item => 
              item.name.toLowerCase() === parsedItem.name.toLowerCase() &&
              areUnitsCompatible(item.unit, parsedItem.unit)
            );
            
            if (existingItem) {
              // Calculate the quantity to add, converting if necessary
              const result = addQuantitiesWithConversion(
                0, 
                existingItem.unit, 
                parsedItem.quantity, 
                parsedItem.unit
              );
              
              if (result) {
                updates.push({
                  item: existingItem,
                  addQuantity: result.quantity
                });
              }
            } else {
              // No compatible existing item found, add as new
              const defaultEmoji = guessEmojiForItem(parsedItem.name) || '📦';
              const itemId = crypto.randomUUID();
              parsedItems.push({
                id: itemId,
                name: parsedItem.name,
                emoji: defaultEmoji,
                quantity: parsedItem.quantity,
                unit: parsedItem.unit,
                category: parsedItem.category || 'Uncategorized',
                purchaseDate: parsedItem.purchaseDate || new Date().toISOString().split('T')[0]
              });
            }
          } else {
            // Add as new item with default emoji
            const defaultEmoji = guessEmojiForItem(parsedItem.name) || '📦';
            const itemId = crypto.randomUUID();
            parsedItems.push({
              id: itemId,
              name: parsedItem.name,
              emoji: defaultEmoji,
              quantity: parsedItem.quantity,
              unit: parsedItem.unit,
              category: parsedItem.category || 'Uncategorized',
              purchaseDate: parsedItem.purchaseDate || new Date().toISOString().split('T')[0]
            });
          }
        });
        
        // Set bulk items immediately
        setBulkItems({ new: parsedItems, existing: updates });
        setShowBulkAdd(null);
        setBulkText('');
        
        // Generate better emojis in background (non-blocking)
        setTimeout(() => {
          parsedItems.forEach(async (item) => {
            try {
              await generateEmojiForItem(item.name, item.id);
            } catch (err) {
              console.error('Failed to generate emoji for', item.name);
            }
          });
        }, 100);
        
        const message = `Found ${parsedItems.length} new items and ${updates.length} updates`;
        showToast(data.warning ? `${message}. ${data.warning}` : message, 'success');
      } else {
        showToast(data.warning || 'No items found to add. Try a different format.', 'info');
      }
    } catch (error) {
      console.error('Error processing text:', error);
      showToast('Failed to process text. Please try again.', 'error');
    }
  };

  const processReceiptImage = async (dataUrl: string) => {
    // Don't clear the image immediately - keep the UI in processing state
    showToast('Processing receipt...', 'info');
    
    if (!dataUrl) {
      showToast('No image selected', 'error');
      setBulkImage(null);
      return;
    }
    
    // Extract base64 from data URL (remove "data:image/...;base64," prefix)
    const base64Image = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    
    try {
      // Step 1: Extract items from receipt
      const extractResponse = await fetch('/api/pantry/parse-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageBase64: base64Image,
          unitSystem: unitSystem
        }),
      });
      
      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || 'Failed to parse receipt');
      }
      
      const extractData = await extractResponse.json();
      
      // Check if it's not a receipt
      if (extractData.isReceipt === false) {
        showToast(extractData.error || 'Not a valid receipt image', 'error');
        setBulkImage(null);
        return;
      }
      
      if (!extractData.items || extractData.items.length === 0) {
        showToast('No items found on receipt', 'error');
        setBulkImage(null);
        return;
      }
      
      console.log(`Extracted ${extractData.items.length} items from receipt`);
      
      // Step 2: Match extracted items with existing pantry
      const matchResponse = await fetch('/api/pantry/parse-receipt', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedItems: extractData.items,
          existingItems: pantryItems.map(item => ({
            id: item.id,
            name: item.name,
            emoji: item.emoji,
            category: item.category,
            unit: item.unit
          }))
        }),
      });
      
      if (!matchResponse.ok) {
        throw new Error('Failed to match items');
      }
      
      const matchData = await matchResponse.json();
      const matchedItems = matchData.items || [];
      
      // Consolidate duplicate items by name and compatible units
      const consolidatedItems = matchedItems.reduce((acc: any[], item: any) => {
        const existingIndex = acc.findIndex(
          (existing) => existing.name.toLowerCase() === item.name.toLowerCase() && 
                        areUnitsCompatible(existing.unit, item.unit)
        );
        
        if (existingIndex >= 0) {
          // Item already exists with compatible unit, add quantities with conversion
          const result = addQuantitiesWithConversion(
            acc[existingIndex].quantity,
            acc[existingIndex].unit,
            item.quantity,
            item.unit
          );
          
          if (result) {
            acc[existingIndex].quantity = result.quantity;
            // Update total price if both have prices
            if (item.price !== undefined && item.price !== null) {
              acc[existingIndex].totalPrice = (acc[existingIndex].totalPrice || 0) + (item.totalPrice || (item.price * item.quantity));
            }
          } else {
            // Units not compatible, add as separate item
            acc.push({...item});
          }
        } else {
          // New item, add to array
          acc.push({...item});
        }
        
        return acc;
      }, []);
      
      // Process matched items
      const parsedItems: PantryItem[] = [];
      const updates: {item: PantryItem, addQuantity: number}[] = [];
      const itemsForPriceTracking: any[] = [];
      
      consolidatedItems.forEach((item: any) => {
        // Prepare price tracking data
        if (item.price !== undefined && item.price !== null) {
          itemsForPriceTracking.push({
            id: crypto.randomUUID(),
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            totalPrice: item.totalPrice || (item.price * item.quantity),
            merchant: extractData.merchant || 'Unknown Store',
            date: extractData.date || new Date().toISOString().split('T')[0],
            emoji: item.emoji || guessEmojiForItem(item.name) || '🛒',
            category: item.category
          });
        }
        
        if (item.exists && item.existingId) {
          // Update existing item
          const existingItem = pantryItems.find(p => p.id === item.existingId);
          if (existingItem) {
            // Calculate the quantity to add, converting if necessary
            const result = addQuantitiesWithConversion(
              0,
              existingItem.unit,
              item.quantity,
              item.unit
            );
            
            if (result) {
              updates.push({
                item: existingItem,
                addQuantity: result.quantity
              });
            }
          }
        } else {
          // Create new item
          const itemId = crypto.randomUUID();
          parsedItems.push({
            id: itemId,
            name: item.name,
            emoji: item.emoji || guessEmojiForItem(item.name) || '🛒',
            quantity: item.quantity,
            unit: item.unit,
            category: item.category || 'Uncategorized',
            purchaseDate: extractData.date || new Date().toISOString().split('T')[0],
            expiryDate: item.expiryDate
          });
        }
      });
      
      // Clear the image and show bulk items for confirmation
      setBulkImage(null);
      setBulkItems({ new: parsedItems, existing: updates });
      setShowBulkAdd(null);
      
      // Store receipt data and merchant info temporarily
      setTempReceiptData({
        items: itemsForPriceTracking,
        merchant: extractData.merchant || 'Unknown Store',
        date: extractData.date || new Date().toISOString().split('T')[0],
        total: extractData.total || 0,
        receiptImage: dataUrl
      });
      
      // Set the selected store from extracted merchant
      setSelectedStore(extractData.merchant || '');
      
      // Generate emojis in background for new items
      setTimeout(() => {
        parsedItems.forEach(async (item) => {
          try {
            await generateEmojiForItem(item.name, item.id);
          } catch (err) {
            console.error('Failed to generate emoji for', item.name);
          }
        });
      }, 100);
      
      showToast(`Found ${parsedItems.length} new items and ${updates.length} updates`, 'success');
    } catch (error) {
      console.error('Error processing receipt:', error);
      showToast('Failed to process receipt. Please try again.', 'error');
      setBulkImage(null);
    }
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBulkImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateBulkItem = (type: 'new' | 'existing', index: number, updates: any) => {
    if (type === 'new') {
      const newItems = [...bulkItems.new];
      newItems[index] = { ...newItems[index], ...updates };
      setBulkItems({ ...bulkItems, new: newItems });
    } else {
      const existingItems = [...bulkItems.existing];
      existingItems[index] = { ...existingItems[index], ...updates };
      setBulkItems({ ...bulkItems, existing: existingItems });
    }
  };

  const removeBulkItem = (type: 'new' | 'existing', index: number) => {
    if (type === 'new') {
      const newItems = bulkItems.new.filter((_, i) => i !== index);
      setBulkItems({ ...bulkItems, new: newItems });
    } else {
      const existingItems = bulkItems.existing.filter((_, i) => i !== index);
      setBulkItems({ ...bulkItems, existing: existingItems });
    }
  };

  const confirmBulkAdd = async () => {
    if (!user) return;
    
    try {
      // Add new items to database
      for (const item of bulkItems.new) {
        const itemData = {
          name: item.name,
          emoji: item.emoji || '📦',
          quantity: item.quantity,
          unit: item.unit,
          category: item.category || 'Uncategorized',
          expiry_date: item.expiryDate || null,
          price: null
        };
        
        const { data, error } = await database.pantry.add(user.id, itemData);
        if (!error && data) {
          setPantryItems(prev => [...prev, {
            id: data.id,
            name: data.name,
            emoji: data.emoji,
            quantity: data.quantity,
            unit: data.unit,
            category: data.category,
            expiryDate: data.expiry_date,
            purchaseDate: data.created_at
          }]);
        }
      }
      
      // Update existing items in database
      for (const update of bulkItems.existing) {
        const newQuantity = update.item.quantity + update.addQuantity;
        const { error } = await database.pantry.update(
          update.item.id, 
          user.id, 
          { quantity: newQuantity }
        );
        
        if (!error) {
          setPantryItems(prev => prev.map(item => 
            item.id === update.item.id 
              ? { ...item, quantity: newQuantity }
              : item
          ));
        } else {
          // Only log errors if they're not "no rows found" errors
          const errorMessage = error.message || error.toString();
          if (!errorMessage.includes('JSON object requested') && !errorMessage.includes('no) rows returned')) {
            console.error('Error updating item:', error);
          }
        }
      }
      
      // Save price tracker data if we have receipt data
      if (tempReceiptData && tempReceiptData.items.length > 0) {
        const receiptId = crypto.randomUUID();
        
        // Save receipt to localStorage
        saveReceiptData({
          id: receiptId,
          merchant: tempReceiptData.merchant,
          date: tempReceiptData.date,
          total: tempReceiptData.total,
          itemCount: tempReceiptData.items.length,
          items: tempReceiptData.items,
          receiptImage: tempReceiptData.receiptImage
        });
        
        // Save each item to price tracker
        for (const priceItem of tempReceiptData.items) {
          try {
            // Check if this item was actually confirmed (not removed by user)
            const wasConfirmed = bulkItems.new.some(i => 
              i.name.toLowerCase() === priceItem.name.toLowerCase()
            ) || bulkItems.existing.some(u => 
              u.item.name.toLowerCase() === priceItem.name.toLowerCase()
            );
            
            if (!wasConfirmed) continue;
            
            // Get existing price tracker items
            const { data: existingPriceItems } = await database.priceTracker.getAll(user.id);
            const existingPriceItem = existingPriceItems?.find(existing => 
              existing.name.toLowerCase() === priceItem.name.toLowerCase()
            );
            
            const newStoreEntry = {
              store: selectedStore || tempReceiptData.merchant || 'Unknown Store',
              price: priceItem.price,
              total_price: priceItem.totalPrice,
              quantity: priceItem.quantity,
              date: tempReceiptData.date,
              receipt_image: tempReceiptData.receiptImage
            };
            
            if (existingPriceItem && Array.isArray(existingPriceItem.stores)) {
              // Update existing price tracker item
              const updatedStores = [...existingPriceItem.stores];
              
              // Remove duplicate from same store on same date
              const duplicateIndex = updatedStores.findIndex((store: any) => 
                store.store === newStoreEntry.store && store.date === newStoreEntry.date
              );
              
              if (duplicateIndex >= 0) {
                updatedStores[duplicateIndex] = newStoreEntry;
              } else {
                updatedStores.push(newStoreEntry);
              }
              
              await database.priceTracker.updateStorePrices(
                existingPriceItem.id, 
                user.id, 
                updatedStores
              );
            } else {
              // Create new price tracker item
              await database.priceTracker.add(user.id, {
                name: priceItem.name,
                stores: [newStoreEntry],
                target_price: null,
                unit: priceItem.unit,
                emoji: priceItem.emoji || '🛒'
              });
            }
          } catch (error) {
            console.error('Error saving price data for item:', priceItem.name, error);
          }
        }
        
        showToast(`Added ${tempReceiptData.items.length} items to price tracker`, 'success');
      }
      
      // Clear temporary data
      setTempReceiptData(null);
      setBulkItems({ new: [], existing: [] });
      showToast(`Added ${bulkItems.new.length} new items and updated ${bulkItems.existing.length} existing items`, 'success');
    } catch (error) {
      console.error('Error in bulk add:', error);
      showToast('Some items failed to add', 'error');
    }
  };

  const generateEmojiForItem = async (itemName: string, itemId?: string) => {
    const targetId = itemId || 'new';
    setGeneratingEmoji(targetId);
    
    try {
      const response = await fetch('/api/emoji/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName }),
      });
      
      const data = await response.json();
      if (data.emoji) {
        if (itemId === 'edit' && editingItem) {
          setEditingItem({ ...editingItem, emoji: data.emoji });
        } else if (itemId) {
          updateItem(itemId, { emoji: data.emoji });
        } else {
          setNewItem(prev => ({ ...prev, emoji: data.emoji }));
        }
      }
    } catch (error) {
      console.error('Error generating emoji:', error);
    } finally {
      setGeneratingEmoji(null);
    }
  };

  const getRecipeRecommendations = async () => {
    setIsGettingRecommendations(true);
    showToast('Generating recipes...', 'info');
    try {
      const mustUseItems = selectedForRecipe.size > 0 
        ? pantryItems.filter(item => selectedForRecipe.has(item.id))
        : [];
      
      const availableItems = pantryItems;

      const response = await fetch('/api/recipes/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mustUseIngredients: mustUseItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit
          })),
          availableIngredients: availableItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit
          })),
          numberOfPeople: numberOfPeople,
          userPreference: userPreference,
          unitSystem: unitSystem
        }),
      });
      
      const data = await response.json();
      if (data.recipes && data.recipes.length > 0) {
        const recipesWithIds = data.recipes.map((recipe: any) => ({
          ...recipe,
          id: crypto.randomUUID(),
          usageFromPantry: recipe.usageFromPantry || []
        }));
        setRecipes(recipesWithIds);
        showToast(`Generated ${data.recipes.length} recipes!`, 'success');
      } else {
        showToast('No recipes generated. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setRecipes([]);
      showToast('Failed to generate recipes. Please try again.', 'error');
    }
    setIsGettingRecommendations(false);
  };

  const applyRecipe = (recipe: Recipe) => {
    // Deduct ingredients from pantry
    const updatedItems = [...pantryItems];
    const usedQuantities: { itemId: string; quantity: number; unit: string; originalItem?: PantryItem }[] = [];
    
    recipe.usageFromPantry.forEach(usage => {
      const itemIndex = updatedItems.findIndex(item => item.id === usage.itemId);
      if (itemIndex !== -1) {
        const item = updatedItems[itemIndex];
        const actualUsed = Math.min(item.quantity, usage.quantity);
        
        // Store the full original item data if it will be completely removed
        const willBeDeleted = item.quantity - actualUsed <= 0;
        usedQuantities.push({ 
          itemId: item.id, 
          quantity: actualUsed, 
          unit: item.unit,
          originalItem: willBeDeleted ? { ...item } : undefined
        });
        
        const newQuantity = item.quantity - actualUsed;
        
        if (newQuantity <= 0) {
          updatedItems.splice(itemIndex, 1);
        } else {
          updatedItems[itemIndex] = { ...item, quantity: newQuantity };
        }
      }
    });
    
    // Update recipe with used quantities
    const updatedRecipe = { ...recipe, usedQuantities };
    setRecipes(recipes.map(r => r.id === recipe.id ? updatedRecipe : r));
    
    // Mark recipe as used
    setUsedRecipes(prev => new Set(prev).add(recipe.id));
    
    setPantryItems(updatedItems);
    showToast('Ingredients have been deducted from your pantry!', 'success');
  };

  const unuseRecipe = (recipe: Recipe) => {
    if (!recipe.usedQuantities) return;
    
    const updatedItems = [...pantryItems];
    
    recipe.usedQuantities.forEach((usage: any) => {
      const existingItemIndex = updatedItems.findIndex(item => item.id === usage.itemId);
      if (existingItemIndex !== -1) {
        // Item exists, add quantity back
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + usage.quantity
        };
      } else if (usage.originalItem) {
        // Item was completely deleted, restore it with the used quantity
        updatedItems.push({
          ...usage.originalItem,
          quantity: usage.quantity
        });
      }
    });
    
    // Remove used quantities from recipe
    const updatedRecipe = { ...recipe, usedQuantities: undefined };
    setRecipes(recipes.map(r => r.id === recipe.id ? updatedRecipe : r));
    
    // Mark recipe as unused
    setUsedRecipes(prev => {
      const newSet = new Set(prev);
      newSet.delete(recipe.id);
      return newSet;
    });
    
    setPantryItems(updatedItems);
    showToast('Ingredient usage has been reversed!', 'info');
  };

  const saveRecipe = async (recipe: Recipe) => {
    setSavingRecipe(recipe.id);
    try {
      // Generate image for the recipe
      const imageResponse = await fetch('/api/recipes/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: recipe.title,
          ingredients: recipe.ingredients.slice(0, 5).map(ing => 
            typeof ing === 'string' ? ing : ing.name
          ) // Use first 5 ingredient names for image generation
        }),
      });
      
      const imageData = await imageResponse.json();
      // Ensure ingredients are properly formatted before saving
      const cleanedIngredients = recipe.ingredients.map(ing => {
        if (typeof ing === 'object') {
          return {
            name: ing.name?.replace(/^\d+\s*/, '').trim(),
            quantity: ing.quantity || 1,
            unit: ing.unit || 'pcs'
          };
        }
        return { name: ing, quantity: 1, unit: 'pcs' };
      });
      
      // Ensure instructions are properly formatted as array of strings
      const cleanedInstructions = Array.isArray(recipe.instructions) 
        ? recipe.instructions.map((inst: any) => 
            typeof inst === 'string' ? inst : String(inst)
          ).filter((inst: string) => inst.trim())
        : ['No instructions provided'];
      
      const recipeData = {
        title: recipe.title,
        description: recipe.description || '',
        ingredients: cleanedIngredients,
        instructions: cleanedInstructions,
        servings: parseInt(recipe.servings || '4'),
        prep_time: parseInt(recipe.prepTime || '0') || null,
        cook_time: null,
        difficulty: 'Medium' as const,
        rating: 0,
        image_url: imageData.imageUrl || `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(recipe.title)}`,
        unit_system: unitSystem,
        tags: []
      };
      
      // Save to database
      const { data, error } = await database.recipes.add(user!.id, recipeData);
      if (error) throw error;
      
      if (data) {
        setSavedRecipes([...savedRecipes, data]);
        showToast('Recipe saved successfully with image!', 'success');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      // Save without image if generation fails
      // Ensure ingredients are properly formatted before saving
      const cleanedIngredients = recipe.ingredients.map(ing => {
        if (typeof ing === 'object') {
          return {
            name: ing.name?.replace(/^\d+\s*/, '').trim(),
            quantity: ing.quantity || 1,
            unit: ing.unit || 'pcs'
          };
        }
        return { name: ing, quantity: 1, unit: 'pcs' };
      });
      
      // Ensure instructions are properly formatted as array of strings
      const cleanedInstructions = Array.isArray(recipe.instructions) 
        ? recipe.instructions.map((inst: any) => 
            typeof inst === 'string' ? inst : String(inst)
          ).filter((inst: string) => inst.trim())
        : ['No instructions provided'];
      
      const recipeData = {
        title: recipe.title,
        description: recipe.description || '',
        ingredients: cleanedIngredients,
        instructions: cleanedInstructions,
        servings: parseInt(recipe.servings || '4'),
        prep_time: parseInt(recipe.prepTime || '0') || null,
        cook_time: null,
        difficulty: 'Medium' as const,
        rating: 0,
        image_url: `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(recipe.title)}`,
        unit_system: unitSystem,
        tags: []
      };
      
      try {
        const { data } = await database.recipes.add(user!.id, recipeData);
        if (data) {
          setSavedRecipes([...savedRecipes, data]);
          showToast('Recipe saved (image generation failed)', 'info');
        }
      } catch (dbError) {
        console.error('Failed to save recipe to database:', dbError);
        showToast('Failed to save recipe. Please try again.', 'error');
      }
    } finally {
      setSavingRecipe(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: PantryItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory(category);
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem.category !== targetCategory) {
      updateItem(draggedItem.id, { category: targetCategory });
    }
    setDraggedItem(null);
    setDragOverCategory(null);
  };

  const groupedItems = pantryItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

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
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">My Pantry</h1>
          <div className="flex gap-2 flex-wrap">
            {/* Recipe Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ChefHat className="w-4 h-4 mr-2" />
                  Recipe
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="p-3 border-b space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Servings:</Label>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 w-6 p-0"
                      onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-medium">{numberOfPeople}</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 w-6 p-0"
                      onClick={() => setNumberOfPeople(Math.min(20, numberOfPeople + 1))}
                    >
                      +
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Units:</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={unitSystem === 'metric' ? 'text-gray-400' : 'font-medium'}>lb</span>
                      <button
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          unitSystem === 'metric' ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                        onClick={async () => {
                          const newSystem = unitSystem === 'metric' ? 'imperial' : 'metric';
                          setUnitSystem(newSystem);
                          
                          // Save to database if user is logged in
                          if (user) {
                            try {
                              await supabase
                                .from('profiles')
                                .update({ 
                                  unit_system: newSystem,
                                  updated_at: new Date().toISOString()
                                })
                                .eq('id', user.id);
                            } catch (error) {
                              console.error('Error updating unit system:', error);
                            }
                          }
                        }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            unitSystem === 'metric' ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={unitSystem === 'metric' ? 'font-medium' : 'text-gray-400'}>kg</span>
                    </div>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => {
                  setUserPreference('');
                  setNumberOfPeople(4);
                  setShowRecipePreference(true);
                }}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Recipe Ideas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowUseSavedRecipe(true)}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Use Saved Recipe
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Add Item Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  Add Item
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowBulkAdd('single')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Single Item
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBulkAdd('text')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Add via Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBulkAdd('receipt')}>
                  <Camera className="w-4 h-4 mr-2" />
                  Add via Receipt
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsBulkEditMode(!isBulkEditMode)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  {isBulkEditMode ? 'Done Editing' : 'Bulk Item Edit'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Dialog for single item add */}
      <Dialog open={showBulkAdd === 'single'} onOpenChange={(open) => !open && setShowBulkAdd(null)}>
        <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Pantry Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your pantry inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-12 h-10"
                        onClick={() => setShowEmojiPicker(showEmojiPicker === 'new' ? null : 'new')}
                      >
                        {newItem.emoji || '😀'}
                      </Button>
                      {showEmojiPicker === 'new' && (
                        <div className="absolute top-12 left-0 z-50 bg-white border rounded-lg shadow-lg p-2 w-64 max-h-48 overflow-y-auto emoji-picker">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mb-2"
                            onClick={() => generateEmojiForItem(newItem.name)}
                            disabled={!newItem.name || generatingEmoji === 'new'}
                          >
                            {generatingEmoji === 'new' ? 'Generating...' : 'AI Generate Emoji'}
                          </Button>
                          <div className="grid grid-cols-8 gap-1">
                            {commonEmojis.map((emoji, idx) => (
                              <button
                                key={idx}
                                className="text-xl hover:bg-gray-100 rounded p-1"
                                onClick={() => {
                                  setNewItem({...newItem, emoji});
                                  setShowEmojiPicker(null);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Input
                      id="itemName"
                      placeholder="Enter item name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={newItem.quantity === 0 ? '' : newItem.quantity.toString()}
                      onChange={(e) => setNewItem({...newItem, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={newItem.unit}
                      onValueChange={(value) => setNewItem({...newItem, unit: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableUnits().map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Vegetables, Meat, Grains, etc."
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={newItem.purchaseDate}
                      onChange={(e) => setNewItem({...newItem, purchaseDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={newItem.expiryDate}
                      onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={addItem} className="w-full">
                  Add Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add via Text Dialog */}
          <Dialog open={showBulkAdd === 'text'} onOpenChange={(open) => !open && setShowBulkAdd(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Items via Text</DialogTitle>
                <DialogDescription>
                  Enter your items in a natural format. Each line can be like: &quot;2 lbs chicken&quot;, &quot;1 dozen eggs&quot;, etc.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter items, one per line:
2 lbs chicken
1 dozen eggs
3 cans tomatoes
4 apples"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={10}
                  className="font-mono"
                />
                <Button 
                  onClick={() => processBulkText(bulkText)} 
                  className="w-full"
                  disabled={!bulkText.trim()}
                >
                  Process Items
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add via Receipt Dialog */}
          <Dialog open={showBulkAdd === 'receipt'} onOpenChange={(open) => !open && setShowBulkAdd(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Items via Receipt</DialogTitle>
                <DialogDescription>
                  Upload a photo or take a picture of your receipt to automatically extract items.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors hover:border-gray-400"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                    
                    const files = Array.from(e.dataTransfer.files);
                    const imageFile = files.find(file => file.type.startsWith('image/'));
                    
                    if (imageFile) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setBulkImage(e.target?.result as string);
                      };
                      reader.readAsDataURL(imageFile);
                    }
                  }}
                >
                  {bulkImage ? (
                    <div className="space-y-4">
                      <img src={bulkImage} alt="Receipt" className="max-h-64 mx-auto" />
                      <Button onClick={() => processReceiptImage(bulkImage)} className="w-full">
                        Process Receipt
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="w-16 h-16 mx-auto text-gray-400" />
                      <p className="text-gray-600">Click to upload or drag and drop</p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <Label htmlFor="receipt-upload">
                        <Button variant="outline" className="cursor-pointer" onClick={() => document.getElementById('receipt-upload')?.click()}>
                          Choose File
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Items Review Dialog */}
          <Dialog open={bulkItems.new.length > 0 || bulkItems.existing.length > 0} onOpenChange={() => setBulkItems({new: [], existing: []})}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Review Items</DialogTitle>
                <DialogDescription>
                  Review and edit the items before adding them to your pantry.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Store Selection */}
                {tempReceiptData && (
                  <div>
                    <Label htmlFor="store-select">Store Name</Label>
                    <div className="flex gap-2 mt-1">
                      <Select
                        value={selectedStore || tempReceiptData.merchant || ''}
                        onValueChange={(value) => setSelectedStore(value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select or enter store name" />
                        </SelectTrigger>
                        <SelectContent>
                          {tempReceiptData.merchant && !existingStores.includes(tempReceiptData.merchant) && (
                            <SelectItem value={tempReceiptData.merchant}>
                              {tempReceiptData.merchant} (detected)
                            </SelectItem>
                          )}
                          {existingStores.map(store => (
                            <SelectItem key={store} value={store}>
                              {store}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Or type new store"
                        value={selectedStore || ''}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}
                
                {bulkItems.new.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">New Items</h3>
                    <div className="space-y-2">
                      {bulkItems.new.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-2xl">{item.emoji || '📦'}</span>
                            <Input
                              value={item.name}
                              onChange={(e) => updateBulkItem('new', index, { name: e.target.value })}
                              className="flex-1"
                              placeholder="Item name"
                            />
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateBulkItem('new', index, { quantity: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                              className="w-full sm:w-20"
                              placeholder="Qty"
                            />
                            <Select
                              value={item.unit}
                              onValueChange={(value) => updateBulkItem('new', index, { unit: value })}
                            >
                              <SelectTrigger className="w-full sm:w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableUnits().map(unit => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBulkItem('new', index)}
                              className="ml-auto sm:ml-0"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {bulkItems.existing.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Update Existing Items</h3>
                    <div className="space-y-2">
                      {bulkItems.existing.map((update, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded bg-blue-50">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-2xl">{update.item.emoji}</span>
                            <span className="flex-1">{update.item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm text-gray-600">
                              Current: {update.item.quantity} {update.item.unit}
                            </span>
                            <span className="text-sm font-semibold">+</span>
                            <Input
                              type="number"
                              value={update.addQuantity}
                              onChange={(e) => updateBulkItem('existing', index, { addQuantity: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                              className="w-full sm:w-20"
                              placeholder="Add"
                            />
                            <span className="text-sm">{update.item.unit}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBulkItem('existing', index)}
                            className="ml-auto sm:ml-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={confirmBulkAdd} className="flex-1">
                    Add Items to Pantry
                  </Button>
                  <Button variant="outline" onClick={() => setBulkItems({new: [], existing: []})}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Item Dialog */}
          {editingItem && (
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit Pantry Item</DialogTitle>
                  <DialogDescription>
                    Update this item in your pantry inventory.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editItemName">Item Name</Label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-12 h-10"
                          onClick={() => setShowEmojiPicker(showEmojiPicker === 'edit' ? null : 'edit')}
                        >
                          {editingItem.emoji || '😀'}
                        </Button>
                        {showEmojiPicker === 'edit' && (
                          <div className="absolute top-12 left-0 z-50 bg-white border rounded-lg shadow-lg p-2 w-64 max-h-48 overflow-y-auto emoji-picker">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mb-2"
                              onClick={() => generateEmojiForItem(editingItem.name, 'edit')}
                              disabled={generatingEmoji === 'edit'}
                            >
                              {generatingEmoji === 'edit' ? 'Generating...' : 'AI Generate Emoji'}
                            </Button>
                            <div className="grid grid-cols-8 gap-1">
                              {commonEmojis.map((emoji, idx) => (
                                <button
                                  key={idx}
                                  className="text-xl hover:bg-gray-100 rounded p-1"
                                  onClick={() => {
                                    setEditingItem({...editingItem, emoji});
                                    setShowEmojiPicker(null);
                                  }}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Input
                        id="editItemName"
                        placeholder="Enter item name"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editQuantity">Quantity</Label>
                      <Input
                        id="editQuantity"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={editingItem.quantity || ''}
                        onChange={(e) => setEditingItem({...editingItem, quantity: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editUnit">Unit</Label>
                      <Select
                        value={editingItem.unit}
                        onValueChange={(value) => setEditingItem({...editingItem, unit: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {standardUnits.map(unit => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editCategory">Category</Label>
                    <Input
                      id="editCategory"
                      placeholder="Vegetables, Meat, Grains, etc."
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editPurchaseDate">Purchase Date</Label>
                      <Input
                        id="editPurchaseDate"
                        type="date"
                        value={editingItem.purchaseDate || ''}
                        onChange={(e) => setEditingItem({...editingItem, purchaseDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editExpiryDate">Expiry Date</Label>
                      <Input
                        id="editExpiryDate"
                        type="date"
                        value={editingItem.expiryDate || ''}
                        onChange={(e) => setEditingItem({...editingItem, expiryDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        updateItem(editingItem.id, editingItem);
                        setEditingItem(null);
                      }} 
                      className="flex-1"
                    >
                      Update Item
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Remove ${editingItem.name}?`)) {
                          removeItem(editingItem.id);
                          setEditingItem(null);
                        }
                      }}
                    >
                      Delete
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setEditingItem(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          


      {recipes.length > 0 && (
        <div className="mb-8 space-y-4">
                  {recipes.map((recipe) => (
          <Card key={recipe.id} className="recipe-card">
              <CardHeader>
                <CardTitle className="text-xl">{recipe.title}</CardTitle>
                {(recipe.servings || recipe.prepTime) && (
                  <CardDescription>
                    {recipe.servings && `Servings: ${recipe.servings}`}
                    {recipe.servings && recipe.prepTime && ' • '}
                    {recipe.prepTime && `Prep time: ${recipe.prepTime}`}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Ingredients:</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-600 border-b">
                          <th className="text-left pb-1">Ingredient</th>
                          <th className="text-center pb-1">Qty</th>
                          <th className="text-center pb-1">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipe.ingredients && recipe.ingredients.map((ingredient, idx) => {
                          const ing = typeof ingredient === 'string' 
                            ? { name: ingredient, quantity: 1, unit: 'pcs' }
                            : ingredient;
                          return (
                            <tr key={idx} className="border-b border-gray-200">
                              <td className="py-1">{ing.name}</td>
                              <td className="text-center py-1">{ing.quantity}</td>
                              <td className="text-center py-1">{ing.unit}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    {recipe.instructions && recipe.instructions.map((instruction, idx) => (
                      <li key={idx} className="text-sm">{instruction}</li>
                    ))}
                  </ol>
                </div>
                <div className="flex gap-2 pt-4">
                  {usedRecipes.has(recipe.id) ? (
                    <Button onClick={() => unuseRecipe(recipe)} size="sm" variant="outline">
                      Unuse Recipe
                    </Button>
                  ) : (
                    <Button onClick={() => applyRecipe(recipe)} size="sm">
                      Use Recipe
                    </Button>
                  )}
                  <Button 
                    onClick={() => saveRecipe(recipe)} 
                    variant="outline" 
                    size="sm"
                    disabled={savingRecipe === recipe.id}
                  >
                    {savingRecipe === recipe.id ? 'Saving...' : 'Save Recipe'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-center">
            <Button onClick={getRecipeRecommendations} variant="outline">
              Generate New Recipes
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card 
            key={category}
            className={dragOverCategory === category ? 'drag-over' : ''}
            onDragOver={(e) => handleDragOver(e, category)}
            onDrop={(e) => handleDrop(e, category)}
            onDragLeave={() => setDragOverCategory(null)}
          >
            <CardHeader>
              {isBulkEditMode && editingCategoryName === category ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={categoryNames[category] || category}
                    onChange={(e) => setCategoryNames({ ...categoryNames, [category]: e.target.value })}
                    onBlur={() => {
                      if (categoryNames[category] && categoryNames[category] !== category) {
                        // Update all items in this category
                        const newCategoryName = categoryNames[category];
                        items.forEach(item => {
                          updateItem(item.id, { category: newCategoryName });
                        });
                      }
                      setEditingCategoryName(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    autoFocus
                    className="text-xl font-semibold"
                  />
                  <span className="text-sm text-gray-500">{items.length} items</span>
                </div>
              ) : (
                <div 
                  className={isBulkEditMode ? "cursor-pointer hover:bg-gray-50 rounded p-2 -m-2" : ""}
                  onClick={() => isBulkEditMode && setEditingCategoryName(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isBulkEditMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 bg-red-100/80 hover:bg-red-200 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCategory(category);
                          }}
                        >
                          <Minus className="w-3 h-3 text-red-600" />
                        </Button>
                      )}
                      <CardTitle className="text-xl">{categoryNames[category] || category}</CardTitle>
                    </div>
                    <span className="text-sm text-gray-500">{items.length} items</span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex flex-col items-center space-y-1 md:cursor-move pantry-item relative transition-all ${
                      selectedForRecipe.has(item.id) ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50/50 rounded-lg p-2' : ''
                    }`}
                    draggable={!isBulkEditMode}
                    onDragStart={(e) => !isBulkEditMode && handleDragStart(e, item)}
                  >

                    {/* Top Controls: Edit Button and Recipe Checkbox or Delete Button */}
                    <div className="absolute -top-1 -right-1 flex items-center gap-1 z-10">
                      {!isBulkEditMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 bg-gray-100/80 hover:bg-gray-200 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem(item);
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                      {isBulkEditMode ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 bg-red-100/80 hover:bg-red-200 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                        >
                          <Minus className="w-3 h-3 text-red-600" />
                        </Button>
                      ) : (
                        <Checkbox
                          checked={selectedForRecipe.has(item.id)}
                          onCheckedChange={() => toggleItemForRecipe(item.id)}
                          className="w-4 h-4 rounded-sm"
                        />
                      )}
                    </div>
                    {/* Emoji - Large and Centered */}
                    <div className="relative">
                      <button
                        className="text-5xl sm:text-6xl hover:scale-105 transition-transform"
                        onClick={() => setShowEmojiPicker(showEmojiPicker === item.id ? null : item.id)}
                      >
                        {item.emoji || '📦'}
                      </button>
                      {showEmojiPicker === item.id && (
                        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-white border rounded-lg shadow-lg p-2 w-64 max-h-48 overflow-y-auto emoji-picker">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mb-2"
                            onClick={() => generateEmojiForItem(item.name, item.id)}
                            disabled={generatingEmoji === item.id}
                          >
                            {generatingEmoji === item.id ? 'Generating...' : 'AI Generate Emoji'}
                          </Button>
                          <div className="grid grid-cols-8 gap-1">
                            {commonEmojis.map((emoji, idx) => (
                              <button
                                key={idx}
                                className="text-xl hover:bg-gray-100 rounded p-1"
                                onClick={() => {
                                  updateItem(item.id, { emoji });
                                  setShowEmojiPicker(null);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Item Name - Small Text */}
                    {editingItemId === item.id ? (
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        onBlur={() => setEditingItemId(null)}
                        onKeyPress={(e) => e.key === 'Enter' && setEditingItemId(null)}
                        autoFocus
                        className="text-xs h-6 w-20 text-center border-none shadow-none focus:shadow-sm"
                      />
                    ) : (
                      <span 
                        className="text-xs text-gray-700 text-center cursor-text hover:text-gray-900 transition-colors min-h-[1rem] px-1"
                        onClick={() => setEditingItemId(item.id)}
                      >
                        {item.name}
                      </span>
                    )}

                    {/* Quantity and Unit on same line */}
                    <div className="flex items-center gap-1">
                      {editingQuantityId === item.id ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          onBlur={() => setEditingQuantityId(null)}
                          onKeyPress={(e) => e.key === 'Enter' && setEditingQuantityId(null)}
                          autoFocus
                          className="text-lg font-semibold w-20 h-8 text-center border-none shadow-none focus:shadow-sm"
                        />
                      ) : (
                        <span 
                          className="text-lg font-semibold text-gray-900 cursor-text hover:text-blue-600 transition-colors"
                          onClick={() => setEditingQuantityId(item.id)}
                        >
                          {item.quantity}
                        </span>
                      )}
                      
                      <Select
                        value={item.unit}
                        onValueChange={(value) => updateItem(item.id, { unit: value })}
                      >
                        <SelectTrigger className="w-16 h-6 text-xs border border-gray-200 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                                                      {getAvailableUnits().map(unit => (
                              <SelectItem key={unit} value={unit} className="text-xs">
                                {unit}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Purchase and Expiry Dates */}
                    <div className="flex flex-col gap-0.5 mt-1">
                      {item.purchaseDate && (
                        <span className="text-[10px] text-gray-500">
                          Bought: {new Date(item.purchaseDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      )}
                      {item.expiryDate && (
                        <span className="text-[10px] text-red-500">
                          Expires: {new Date(item.expiryDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      )}
                    </div>


                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pantryItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">Your pantry is empty.</p>
            <p className="text-sm text-gray-400">Add some items to get started!</p>
          </CardContent>
        </Card>
      )}

      {/* Tip section */}
      {pantryItems.length > 0 && (
        <div className="mt-6 mb-6 text-center">
          <p className="text-sm text-gray-600">
            Tip: Check items to require in recipes
          </p>
        </div>
      )}

      {savedRecipes.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Saved Recipes</h2>
            <Link href="/recipes">
              <Button variant="outline">
                View All Recipes ({savedRecipes.length})
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {savedRecipes.slice(-4).reverse().map((recipe) => (
              <Card key={recipe.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{recipe.title}</CardTitle>
                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-sm">
                        {i < (recipe.rating || 0) ? '⭐' : '☆'}
                      </span>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button onClick={() => setRecipes([recipe])} size="sm" variant="outline">
                      View in Pantry
                    </Button>
                    <Link href={`/recipes/${recipe.id}`}>
                      <Button size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Use Saved Recipe Dialog */}
      <Dialog open={showUseSavedRecipe} onOpenChange={setShowUseSavedRecipe}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Use Saved Recipe</DialogTitle>
            <DialogDescription>
              Select a recipe to use. The required ingredients will be deducted from your pantry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {savedRecipes.map((recipe) => (
              <Card key={recipe.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{recipe.title}</CardTitle>
                      {recipe.description && <CardDescription>{recipe.description}</CardDescription>}
                    </div>
                    <div className="flex gap-2">
                      {usedRecipes.has(recipe.id) ? (
                        <Button 
                          onClick={() => {
                            unuseRecipe(recipe);
                            setShowUseSavedRecipe(false);
                          }} 
                          size="sm" 
                          variant="outline"
                        >
                          Unuse Recipe
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => {
                            applyRecipe(recipe);
                            setShowUseSavedRecipe(false);
                          }} 
                          size="sm"
                        >
                          Use Recipe
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Ingredients from Pantry:</h4>
                      <ul className="space-y-1">
                        {recipe.usageFromPantry && recipe.usageFromPantry.map((usage, idx) => {
                          const pantryItem = pantryItems.find(item => item.id === usage.itemId);
                          return pantryItem ? (
                            <li key={idx} className={pantryItem.quantity < usage.quantity ? 'text-red-600' : ''}>
                              {usage.quantity} {usage.unit} {pantryItem.name} 
                              {pantryItem.quantity < usage.quantity && ` (need ${usage.quantity - pantryItem.quantity} more)`}
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                    <div>
                      {recipe.servings && <p><strong>Servings:</strong> {recipe.servings}</p>}
                      {recipe.prepTime && <p><strong>Prep Time:</strong> {recipe.prepTime}</p>}
                      {recipe.rating && <p><strong>Rating:</strong> {'⭐'.repeat(recipe.rating)}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {savedRecipes.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No saved recipes yet. Generate and save some recipes first!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Recipe Preference Dialog */}
      <Dialog open={showRecipePreference} onOpenChange={setShowRecipePreference}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Get Recipe Ideas</DialogTitle>
            <DialogDescription>
              Tell us what kind of recipe you&apos;re looking for
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipePreference">What would you like to cook?</Label>
              <Textarea
                id="recipePreference"
                placeholder="e.g., pasta dish, healthy salad, quick dinner, vegetarian meal..."
                value={userPreference}
                onChange={(e) => setUserPreference(e.target.value)}
                rows={3}
              />
            </div>
            {selectedForRecipe.size > 0 && (
              <p className="text-sm text-gray-600">
                {selectedForRecipe.size} item{selectedForRecipe.size > 1 ? 's' : ''} will be required in the recipes
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowRecipePreference(false);
                setUserPreference('');
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowRecipePreference(false);
                  getRecipeRecommendations();
                }}
                disabled={isGettingRecommendations || pantryItems.length === 0}
              >
                {isGettingRecommendations ? 'Getting Recipes...' : 'Get Recipes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Use Saved Recipe Dialog */}
      <Dialog open={showUseSavedRecipe} onOpenChange={setShowUseSavedRecipe}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Use Saved Recipe</DialogTitle>
            <DialogDescription>
              Select a saved recipe to use its ingredients from your pantry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {savedRecipes.map((recipe) => (
              <Card key={recipe.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {recipe.title}
                    <div className="flex gap-2">
                      {usedRecipes.has(recipe.id) ? (
                        <Button onClick={() => unuseRecipe(recipe)} size="sm" variant="outline">
                          Unuse Recipe
                        </Button>
                      ) : (
                        <Button onClick={() => applyRecipe(recipe)} size="sm">
                          Use Recipe
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                  {recipe.description && (
                    <CardDescription>{recipe.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      </div>
    </ProtectedRoute>
  );
} 