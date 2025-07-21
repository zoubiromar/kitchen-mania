'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, ChevronDown, Camera, FileText, Plus, Receipt, ChefHat, Sparkles, BookOpen } from 'lucide-react';
import { Toast, useToast } from '@/components/toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { saveReceiptData, savePriceData } from '@/utils/localStorage';
import { useAuth } from '@/components/AuthContext';
import { database } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { ProtectedRoute } from '@/components/AuthContext';

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
  usedQuantities?: { itemId: string; quantity: number; unit: string }[];
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
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
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
        
        // If user has no items, add some default items
        if (!items || items.length === 0) {
          const isMetric = profile?.unit_system === 'metric';
          const defaultItems = [
            { name: 'Eggs', emoji: '🥚', quantity: 12, unit: 'pcs', category: 'Dairy' },
            { name: 'Milk', emoji: '🥛', quantity: 1, unit: isMetric ? 'L' : 'gal', category: 'Dairy' },
            { name: 'Bread', emoji: '🍞', quantity: 1, unit: 'loaf', category: 'Grains' },
            { name: 'Butter', emoji: '🧈', quantity: 1, unit: isMetric ? 'pack' : 'stick', category: 'Dairy' },
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

  const updateItem = async (id: string, updates: Partial<PantryItem>) => {
    if (!user) return;
    
    try {
      const dbUpdates: any = {};
      if ('name' in updates) dbUpdates.name = updates.name;
      if ('emoji' in updates) dbUpdates.emoji = updates.emoji;
      if ('quantity' in updates) dbUpdates.quantity = updates.quantity;
      if ('unit' in updates) dbUpdates.unit = updates.unit;
      if ('category' in updates) dbUpdates.category = updates.category;
      if ('expiryDate' in updates) dbUpdates.expiry_date = updates.expiryDate;
      
      const { error } = await database.pantry.update(id, user.id, dbUpdates);
      if (error) throw error;
      
      setPantryItems(pantryItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (error) {
      console.error('Error updating item:', error);
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
    if (!text.trim()) {
      showToast('Please enter some items to add', 'error');
      return;
    }
    
    showToast('Processing items...', 'info');
    
    try {
      // Use API to parse text with AI if available
      const response = await fetch('/api/pantry/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          existingItems: pantryItems.map(item => ({ name: item.name })),
          unitSystem: unitSystem
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse items');
      }
      
      if (data.items && data.items.length > 0) {
        const parsedItems: PantryItem[] = [];
        const updates: {item: PantryItem, addQuantity: number}[] = [];
        
        data.items.forEach((parsedItem: any) => {
          if (parsedItem.exists) {
            // Find the existing item
            const existingItem = pantryItems.find(item => 
              item.name === parsedItem.name
            );
            
            if (existingItem) {
              updates.push({
                item: existingItem,
                addQuantity: parsedItem.quantity
              });
            }
          } else {
            // Add as new item with default emoji
            const defaultEmoji = guessEmojiForItem(parsedItem.name) || '📦';
            parsedItems.push({
              id: Date.now().toString() + Math.random(),
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
        
        showToast(`Found ${parsedItems.length} new items and ${updates.length} updates`, 'success');
      } else {
        showToast('No items found to add. Try a different format.', 'info');
      }
    } catch (error) {
      // Fallback to simple parsing if API fails
      console.error('Error parsing with AI:', error);
      showToast('Using simple parsing...', 'info');
      
      // Simple fallback parsing logic
      const lines = text.split('\n').filter(line => line.trim());
      const parsedItems: PantryItem[] = [];
      const updates: {item: PantryItem, addQuantity: number}[] = [];
      
      lines.forEach(line => {
        // Try multiple patterns to match different formats
        let matched = false;
        
        // Pattern 1: "2 lbs chicken" or "2 chicken"
        let match = line.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/);
        if (match) {
          const [, quantity, unit, name] = match;
          const existingItem = pantryItems.find(item => 
            item.name.toLowerCase() === name.toLowerCase()
          );
          
          if (existingItem) {
            updates.push({
              item: existingItem,
              addQuantity: parseFloat(quantity)
            });
          } else {
            const defaultEmoji = guessEmojiForItem(name) || '📦';
            parsedItems.push({
              id: Date.now().toString() + Math.random(),
              name: name.trim(),
              emoji: defaultEmoji,
              quantity: parseFloat(quantity),
              unit: unit || 'pcs',
              category: 'Uncategorized',
              purchaseDate: new Date().toISOString().split('T')[0]
            });
          }
        }
        
        // Pattern 2: Just item name (assume 1 piece)
        if (!matched && line.trim()) {
          const name = line.trim();
          const existingItem = pantryItems.find(item => 
            item.name.toLowerCase() === name.toLowerCase()
          );
          
          if (existingItem) {
            updates.push({
              item: existingItem,
              addQuantity: 1
            });
          } else {
            const defaultEmoji = guessEmojiForItem(name) || '📦';
            parsedItems.push({
              id: Date.now().toString() + Math.random(),
              name: name,
              emoji: defaultEmoji,
              quantity: 1,
              unit: 'pcs',
              category: 'Uncategorized',
              purchaseDate: new Date().toISOString().split('T')[0]
            });
          }
        }
      });
      
      if (parsedItems.length > 0 || updates.length > 0) {
        setBulkItems({ new: parsedItems, existing: updates });
        setShowBulkAdd(null);
        setBulkText('');
        showToast(`Found ${parsedItems.length} new items and ${updates.length} updates`, 'success');
      } else {
        showToast('No items found. Try format like: "2 eggs" or "3 lbs chicken"', 'error');
      }
    }
  };

  const processReceiptImage = async (imageUrl: string) => {
    try {
      showToast('Processing receipt...', 'info');
      
      // Call API to process receipt
      const response = await fetch('/api/pantry/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: imageUrl,
          existingItems: pantryItems.map(item => ({ name: item.name })),
          unitSystem: unitSystem
        }),
      });
      
      const data = await response.json();
      
      // Check if the response indicates an error
      if (!response.ok || data.error) {
        showToast(data.error || 'Failed to process receipt. Please ensure the image is a valid receipt.', 'error');
        setBulkImage(null);
        return;
      }
      
      if (data.items) {
        const parsedItems: PantryItem[] = [];
        const updates: {item: PantryItem, addQuantity: number}[] = [];
        const priceData: any[] = [];
        
        data.items.forEach((receiptItem: any) => {
          if (receiptItem.exists) {
            // Find the existing item
            const existingItem = pantryItems.find(item => 
              item.name === receiptItem.name
            );
            
            if (existingItem) {
              updates.push({
                item: existingItem,
                addQuantity: receiptItem.quantity
              });
            }
          } else {
            // Add as new item with default emoji
            const defaultEmoji = guessEmojiForItem(receiptItem.name) || '📦';
            parsedItems.push({
              id: Date.now().toString() + Math.random(),
              name: receiptItem.name,
              emoji: defaultEmoji,
              quantity: receiptItem.quantity,
              unit: receiptItem.unit,
              category: receiptItem.category || 'Uncategorized',
              purchaseDate: receiptItem.purchaseDate || data.date || new Date().toISOString().split('T')[0]
            });
          }
          
          // Save price data for tracker
          if (receiptItem.price || receiptItem.totalPrice) {
            priceData.push({
              id: Date.now().toString() + Math.random(),
              name: receiptItem.name,
              pricePerUnit: receiptItem.price,
              totalPrice: receiptItem.totalPrice,
              quantity: receiptItem.quantity,
              unit: receiptItem.unit,
              merchant: data.merchant || 'Unknown',
              date: data.date || new Date().toISOString().split('T')[0],
              receiptImage: imageUrl
            });
          }
        });
        
        // Save receipt data (without image to save space)
        if (data.merchant || data.items.length > 0) {
          const receiptId = Date.now().toString();
          const receiptData = {
            id: receiptId,
            merchant: data.merchant || 'Unknown',
            date: data.date || new Date().toISOString().split('T')[0],
            total: data.total || priceData.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0),
            itemCount: data.items.length,
            items: data.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              price: item.price,
              totalPrice: item.totalPrice
            }))
          };
          
          // Save receipt without image
          const receiptSaved = saveReceiptData(receiptData);
          
          if (receiptSaved) {
            // Update price data with receipt ID
            priceData.forEach(item => item.receiptId = receiptId);
          }
        }
        
        // Save price tracking data to database
        if (user && priceData.length > 0) {
          for (const item of priceData) {
            try {
              // Check if item already exists in price tracker
              const { data: existingItems } = await database.priceTracker.getAll(user.id);
              const existingItem = existingItems?.find(existing => existing.name.toLowerCase() === item.name.toLowerCase());
              
              if (existingItem) {
                // Add new store price to existing item
                const currentStores = existingItem.stores || [];
                const newStoreEntry = {
                  store: item.merchant,
                  price: item.pricePerUnit || 0,
                  total_price: item.totalPrice || 0,
                  quantity: item.quantity,
                  date: item.date
                };
                
                // Avoid duplicates from same store on same date
                const updatedStores = currentStores.filter((store: any) => 
                  !(store.store === item.merchant && store.date === item.date)
                );
                updatedStores.push(newStoreEntry);
                
                await database.priceTracker.updateStorePrices(existingItem.id, user.id, updatedStores);
              } else {
                // Create new price tracking item
                await database.priceTracker.add(user.id, {
                  name: item.name,
                  stores: [{
                    store: item.merchant,
                    price: item.pricePerUnit || 0,
                    total_price: item.totalPrice || 0,
                    quantity: item.quantity,
                    date: item.date
                  }],
                  target_price: null,
                  unit: item.unit,
                  emoji: item.emoji || '🛒'
                });
              }
            } catch (error) {
              console.error('Error saving price data:', error);
            }
          }
        }
        
        // Set bulk items immediately
        setBulkItems({ new: parsedItems, existing: updates });
        setShowBulkAdd(null);
        setBulkImage(null);
        showToast(`Processed ${data.items.length} items from receipt`, 'success');
        
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
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      showToast('Failed to process receipt', 'error');
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
        }
      }
      
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
      if (data.recipes && Array.isArray(data.recipes)) {
        const formattedRecipes: Recipe[] = data.recipes.map((recipe: any, index: number) => ({
          id: Date.now().toString() + index,
          title: recipe.title || `Recipe ${index + 1}`,
          description: recipe.description,
          ingredients: recipe.ingredients?.map((ing: any) => {
            // Handle both string and object formats
            if (typeof ing === 'string') {
              // Parse string format like "2 cups flour"
              const match = ing.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(?:of\s+)?(.+)$/);
              if (match) {
                return {
                  name: match[3].trim(),
                  quantity: parseFloat(match[1]),
                  unit: match[2] || 'pcs'
                };
              }
              return { name: ing, quantity: 1, unit: 'pcs' };
            }
            // Ensure object has correct field order and clean name
            return {
              name: ing.name?.replace(/^\d+\s*/, '').trim(), // Remove any leading numbers
              quantity: ing.quantity || 1,
              unit: ing.unit || 'pcs'
            };
          }) || [],
          instructions: recipe.instructions || [],
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          usageFromPantry: recipe.usageFromPantry || []
        }));
        setRecipes(formattedRecipes);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setRecipes([]);
    }
    setIsGettingRecommendations(false);
  };

  const applyRecipe = (recipe: Recipe) => {
    // Deduct ingredients from pantry
    const updatedItems = [...pantryItems];
    const usedQuantities: { itemId: string; quantity: number; unit: string }[] = [];
    
    recipe.usageFromPantry.forEach(usage => {
      const itemIndex = updatedItems.findIndex(item => item.id === usage.itemId);
      if (itemIndex !== -1) {
        const item = updatedItems[itemIndex];
        const actualUsed = Math.min(item.quantity, usage.quantity);
        usedQuantities.push({ itemId: item.id, quantity: actualUsed, unit: item.unit });
        
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
    
    // Get all saved items from localStorage to restore completely used items
    const allSavedItems = JSON.parse(localStorage.getItem('pantryItems') || '[]');
    const updatedItems = [...pantryItems];
    
    recipe.usedQuantities.forEach(usage => {
      const existingItemIndex = updatedItems.findIndex(item => item.id === usage.itemId);
      if (existingItemIndex !== -1) {
        // Item exists, add quantity back
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + usage.quantity
        };
      } else {
        // Item was completely used, need to recreate it from saved data
        const originalItem = allSavedItems.find((item: PantryItem) => item.id === usage.itemId);
        if (originalItem) {
          updatedItems.push({
            ...originalItem,
            quantity: usage.quantity
          });
        }
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
      
      const recipeData = {
        title: recipe.title,
        description: recipe.description || '',
        ingredients: cleanedIngredients,
        instructions: recipe.instructions,
        servings: parseInt(recipe.servings || '4'),
        prep_time: parseInt(recipe.prepTime || '0') || null,
        cook_time: null,
        difficulty: 'Medium' as const,
        rating: 0,
        image_url: imageData.imageUrl || '/api/placeholder/400/300',
        unit_system: unitSystem
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
      
      const recipeData = {
        title: recipe.title,
        description: recipe.description || '',
        ingredients: cleanedIngredients,
        instructions: recipe.instructions,
        servings: parseInt(recipe.servings || '4'),
        prep_time: parseInt(recipe.prepTime || '0') || null,
        cook_time: null,
        difficulty: 'Medium' as const,
        rating: 0,
        image_url: '/api/placeholder/400/300',
        unit_system: unitSystem
      };
      
      const { data } = await database.recipes.add(user!.id, recipeData);
      if (data) {
        setSavedRecipes([...savedRecipes, data]);
        showToast('Recipe saved (image generation failed)', 'info');
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
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold">My Pantry</h1>
          <div className="flex gap-2">
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
                        onClick={() => {
                          const newSystem = unitSystem === 'metric' ? 'imperial' : 'metric';
                          setUnitSystem(newSystem);
                          localStorage.setItem('unitSystem', newSystem);
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Tip: Check items to require in recipes
        </p>
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => generateEmojiForItem(newItem.name)}
                            disabled={!newItem.name || generatingEmoji === 'new'}
                          >
                            {generatingEmoji === 'new' ? 'Generating...' : 'AI Generate Emoji'}
                          </Button>
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
                      value={newItem.quantity || ''}
                      onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})}
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
                              onChange={(e) => updateBulkItem('new', index, { quantity: parseInt(e.target.value) || 0 })}
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
                              onChange={(e) => updateBulkItem('existing', index, { addQuantity: parseInt(e.target.value) || 0 })}
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
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => generateEmojiForItem(editingItem.name, 'edit')}
                              disabled={generatingEmoji === 'edit'}
                            >
                              {generatingEmoji === 'edit' ? 'Generating...' : 'AI Generate Emoji'}
                            </Button>
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
                        {recipe.ingredients.map((ingredient, idx) => {
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
                    {recipe.instructions.map((instruction, idx) => (
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
              <CardTitle>{category}</CardTitle>
              <CardDescription>{items.length} items</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex flex-col items-center space-y-1 md:cursor-move pantry-item relative transition-all ${
                      selectedForRecipe.has(item.id) ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50/50 rounded-lg p-2' : ''
                    }`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, item)}
                  >

                    {/* Top Controls: Edit Button and Recipe Checkbox */}
                    <div className="absolute -top-1 -right-1 flex items-center gap-1 z-10">
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
                      <Checkbox
                        checked={selectedForRecipe.has(item.id)}
                        onCheckedChange={() => toggleItemForRecipe(item.id)}
                        className="w-4 h-4 rounded-sm"
                      />
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => generateEmojiForItem(item.name, item.id)}
                            disabled={generatingEmoji === item.id}
                          >
                            {generatingEmoji === item.id ? 'Generating...' : 'AI Generate Emoji'}
                          </Button>
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
                        {recipe.usageFromPantry.map((usage, idx) => {
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