'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Receipt, Edit, Eye, TrendingUp, TrendingDown, DollarSign, GripVertical, Minus } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { database } from '@/lib/database';
import { ProtectedRoute } from '@/components/AuthContext';
import { Toast, useToast } from '@/components/toast';

interface PriceEntry {
  id: string;
  name: string;
  store: string;
  price: number;
  quantity: number;
  unit: string;
  emoji: string;
  date: string;
  receipt_image?: string | null;
}

interface ReceiptData {
  id: string;
  image: string;
  merchant?: string;
  date: string;
  total?: number;
  itemCount: number;
}

export default function TrackerPage() {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [priceHistory, setPriceHistory] = useState<PriceEntry[]>([]);
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [editingItem, setEditingItem] = useState<PriceEntry | null>(null);
  const [showReceiptImage, setShowReceiptImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<PriceEntry>({
    id: '',
    name: '',
    store: '',
    price: 0,
    quantity: 1,
    unit: 'pcs',
    emoji: '🛒',
    date: new Date().toISOString().split('T')[0],
    receipt_image: null
  });
  const [draggedItem, setDraggedItem] = useState<PriceEntry | null>(null);
  const [dragOverItem, setDragOverItem] = useState<PriceEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const loadPriceData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await database.priceTracker.getAll(user.id);
        if (error) throw error;
        
        // Transform the data from multi-store format to single-entry format
        const formattedData: PriceEntry[] = [];
        
        data?.forEach(item => {
          if (item.stores && Array.isArray(item.stores)) {
            // Create a separate entry for each store price
            item.stores.forEach((store: any) => {
              formattedData.push({
                id: `${item.id}-${store.store}-${store.date}`,
                name: item.name,
                store: store.store,
                price: store.price,
                quantity: store.quantity || 1,
                unit: item.unit,
                emoji: item.emoji || '🛒',
                date: store.date,
                receipt_image: store.receipt_image || null
              });
            });
          }
        });
        
        setPriceHistory(formattedData);
        
        // Load receipts from localStorage for now (until we implement receipt storage in DB)
        const savedReceipts = JSON.parse(localStorage.getItem('receipts') || '[]');
        setReceipts(savedReceipts);
      } catch (error) {
        console.error('Error loading price data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPriceData();
  }, [user]);

  // Get all unique merchants
  const getAllMerchants = () => {
    const merchants = new Set<string>();
    priceHistory.forEach(item => {
      merchants.add(item.store);
    });
    return Array.from(merchants).sort();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: PriceEntry) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, item: PriceEntry) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(item);
  };

  const handleDrop = (e: React.DragEvent, targetItem: PriceEntry) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const draggedIndex = priceHistory.findIndex(item => item.id === draggedItem.id);
    const targetIndex = priceHistory.findIndex(item => item.id === targetItem.id);

    const newHistory = [...priceHistory];
    newHistory.splice(draggedIndex, 1);
    newHistory.splice(targetIndex, 0, draggedItem);

    setPriceHistory(newHistory);
    // Note: We're only updating the UI order, not persisting to DB
    // In a production app, you might want to add a sort_order column
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    
    try {
      const { error } = await database.priceTracker.delete(itemId, user.id);
      if (error) throw error;
      
      const newHistory = priceHistory.filter(item => item.id !== itemId);
      setPriceHistory(newHistory);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const filteredItems = priceHistory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMerchant = selectedMerchant === 'all' || 
        item.store === selectedMerchant;
      return matchesSearch && matchesMerchant;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'price':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const updatePriceEntry = async (updatedEntry: PriceEntry) => {
    if (!user) return;
    
    try {
      // For now, we'll just update the local state
      // Database update would need to be handled differently
      const updatedHistory = priceHistory.map(item =>
        item.id === updatedEntry.id ? updatedEntry : item
      );
      setPriceHistory(updatedHistory);
      setEditingItem(null);
      showToast('Item updated successfully', 'success');
    } catch (error) {
      console.error('Error updating price entry:', error);
      showToast('Failed to update item', 'error');
    }
  };

  const deletePriceEntry = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await database.priceTracker.delete(id, user.id);
      if (error) throw error;
      
      const updatedHistory = priceHistory.filter(item => item.id !== id);
      setPriceHistory(updatedHistory);
    } catch (error) {
      console.error('Error deleting price entry:', error);
    }
  };

  // Calculate price trend (if we have historical data)
  const calculatePriceTrend = (item: PriceEntry) => {
    // This would be implemented with actual historical data
    // For now, return null
    return null;
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Price Tracker</h1>
            <p className="text-gray-600">Track prices and view your shopping history</p>
          </div>
          <Link href="/pantry">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pantry
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Merchants" />
            </SelectTrigger>
            <SelectContent>
              {getAllMerchants().map(merchant => (
                <SelectItem key={merchant} value={merchant}>
                  {merchant === 'all' ? 'All Merchants' : merchant}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Latest Update</SelectItem>
              <SelectItem value="price">Lowest Price</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price History List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Price History</CardTitle>
                <CardDescription>
                  {isEditMode ? 'Drag items to reorder or click minus to remove' : 'Click on any item to edit details'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewItem({
                      id: '',
                      name: '',
                      store: '',
                      price: 0,
                      quantity: 1,
                      unit: 'pcs',
                      emoji: '🛒',
                      date: new Date().toISOString().split('T')[0],
                      receipt_image: null
                    });
                    setIsAddingItem(true);
                  }}
                >
                  Add Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? 'Done' : 'Edit'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const trend = calculatePriceTrend(item);
                
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg transition-colors ${
                      isEditMode ? 'cursor-move' : 'hover:bg-gray-50'
                    } ${dragOverItem?.id === item.id ? 'border-blue-500 bg-blue-50' : ''}`}
                    draggable={isEditMode}
                    onDragStart={isEditMode ? (e) => handleDragStart(e, item) : undefined}
                    onDragOver={isEditMode ? (e) => handleDragOver(e, item) : undefined}
                    onDrop={isEditMode ? (e) => handleDrop(e, item) : undefined}
                    onDragEnd={isEditMode ? handleDragEnd : undefined}
                  >
                    <div className="flex items-start sm:items-center w-full">
                      {/* Drag Handle and Delete Button in Edit Mode */}
                      {isEditMode && (
                        <div className="flex items-center gap-2 mr-3">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Item Info */}
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{item.name}</span>
                            {trend && (
                              <span className={`flex items-center text-xs ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                                {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.quantity} {item.unit} • ${item.price.toFixed(2)} • {item.store}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(item.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Mobile: Stack price and merchant info vertically */}
                      <div className="mt-2 sm:mt-0 sm:flex sm:items-center sm:gap-4">
                        {/* Lowest Price with View button on mobile */}
                        {/* Removed lowest price info as per edit hint */}

                        {/* Latest Store with Edit button on mobile */}
                        {/* Removed latest store info as per edit hint */}

                        {/* Actions - Desktop only */}
                        {!isEditMode && (
                          <div className="hidden sm:flex flex-col items-center gap-1 sm:ml-4">
                            {/* View Receipt Button - Always show */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (item.receipt_image) {
                                  setShowReceiptImage(item.receipt_image);
                                } else {
                                  showToast('No receipt image available for this item', 'info');
                                }
                              }}
                              className="h-8 w-8 p-0"
                              title="View Receipt"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(item)}
                              className="h-8 w-8 p-0"
                              title="Edit Item"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No price history found. Start by scanning receipts in the pantry!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Item Dialog */}
        {editingItem && (
          <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Price Tracker Item</DialogTitle>
                <DialogDescription>
                  Update the details for this item
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editName">Item Name</Label>
                  <Input
                    id="editName"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="editQuantity">Quantity</Label>
                    <Input
                      id="editQuantity"
                      type="number"
                      step="0.01"
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem({
                        ...editingItem, 
                        quantity: parseFloat(e.target.value) || 1
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editUnit">Unit</Label>
                    <Select
                      value={editingItem.unit}
                      onValueChange={(value) => setEditingItem({...editingItem, unit: value})}
                    >
                      <SelectTrigger id="editUnit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">pcs</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="gal">gal</SelectItem>
                        <SelectItem value="fl oz">fl oz</SelectItem>
                        <SelectItem value="cups">cups</SelectItem>
                        <SelectItem value="bunch">bunch</SelectItem>
                        <SelectItem value="bag">bag</SelectItem>
                        <SelectItem value="box">box</SelectItem>
                        <SelectItem value="can">can</SelectItem>
                        <SelectItem value="jar">jar</SelectItem>
                        <SelectItem value="bottle">bottle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editPrice">Price</Label>
                    <Input
                      id="editPrice"
                      type="number"
                      step="0.01"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({
                        ...editingItem, 
                        price: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editStore">Store</Label>
                    <Input
                      id="editStore"
                      value={editingItem.store}
                      onChange={(e) => setEditingItem({...editingItem, store: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editDate">Date</Label>
                    <Input
                      id="editDate"
                      type="date"
                      value={editingItem.date}
                      onChange={(e) => setEditingItem({...editingItem, date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button onClick={() => updatePriceEntry(editingItem)} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deletePriceEntry(editingItem.id);
                      setEditingItem(null);
                    }}
                  >
                    Delete Item
                  </Button>
                  <Button variant="outline" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Item Dialog */}
        {isAddingItem && (
          <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Price Tracker Item</DialogTitle>
                <DialogDescription>
                  Add a new item to track prices across different stores
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newName">Item Name</Label>
                  <Input
                    id="newName"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Enter item name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="newUnit">Unit</Label>
                  <Select
                      value={newItem.unit}
                      onValueChange={(value) => setNewItem({...newItem, unit: value})}
                  >
                      <SelectTrigger id="newUnit">
                        <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pcs">pcs</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="gal">gal</SelectItem>
                        <SelectItem value="fl oz">fl oz</SelectItem>
                        <SelectItem value="cups">cups</SelectItem>
                        <SelectItem value="bunch">bunch</SelectItem>
                        <SelectItem value="bag">bag</SelectItem>
                        <SelectItem value="box">box</SelectItem>
                        <SelectItem value="can">can</SelectItem>
                        <SelectItem value="jar">jar</SelectItem>
                        <SelectItem value="bottle">bottle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="newPrice">Price</Label>
                    <Input
                      id="newPrice"
                      type="number"
                      step="0.01"
                      value={newItem.price || ''}
                      onChange={(e) => setNewItem({
                        ...newItem, 
                        price: parseFloat(e.target.value) || 0
                      })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Store Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newStore">Store</Label>
                    <Input
                      id="newStore"
                      placeholder="Store name"
                      value={newItem.store}
                      onChange={(e) => setNewItem({...newItem, store: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newDate">Date</Label>
                    <Input
                      id="newDate"
                      type="date"
                      value={newItem.date}
                      onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={async () => {
                      if (!user || !newItem.name || !newItem.store) {
                        showToast('Please fill in all required fields', 'error');
                        return;
                      }
                      
                      try {
                        const { error } = await database.priceTracker.add(user.id, {
                          name: newItem.name,
                          stores: [{
                            store: newItem.store,
                            price: newItem.price,
                            quantity: newItem.quantity,
                            date: newItem.date,
                            receipt_image: newItem.receipt_image
                          }],
                          target_price: null,
                          unit: newItem.unit,
                          emoji: newItem.emoji
                        });
                        
                        if (error) throw error;
                        
                        showToast('Item added successfully', 'success');
                        setIsAddingItem(false);
                        
                        // Reload price history
                        const { data: priceData } = await database.priceTracker.getAll(user.id);
                        
                        // Transform the data from multi-store format to single-entry format
                        const formattedData: PriceEntry[] = [];
                        
                        priceData?.forEach(item => {
                          if (item.stores && Array.isArray(item.stores)) {
                            // Create a separate entry for each store price
                            item.stores.forEach((store: any) => {
                              formattedData.push({
                                id: `${item.id}-${store.store}-${store.date}`,
                                name: item.name,
                                store: store.store,
                                price: store.price,
                                quantity: store.quantity || 1,
                                unit: item.unit,
                                emoji: item.emoji || '🛒',
                                date: store.date,
                                receipt_image: store.receipt_image || null
                              });
                            });
                          }
                        });
                        
                        setPriceHistory(formattedData);
                      } catch (error) {
                        console.error('Error adding item:', error);
                        showToast('Failed to add item', 'error');
                      }
                    }} 
                    className="flex-1"
                    disabled={!newItem.name || !newItem.store}
                  >
                    Add Item
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingItem(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Receipt Image Dialog */}
        {showReceiptImage && (
          <Dialog open={!!showReceiptImage} onOpenChange={() => setShowReceiptImage(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Receipt Image</DialogTitle>
              </DialogHeader>
              <div className="relative w-full h-[600px]">
                <Image
                  src={showReceiptImage}
                  alt="Receipt"
                  fill
                  className="object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </ProtectedRoute>
  );
} 