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

interface StorePrice {
  store: string;
  price: number;
  total_price?: number;
  quantity?: number;
  date: string;
  receipt_image?: string | null;
}

interface PriceEntry {
  id: string;
  name: string;
  stores: StorePrice[];
  target_price: number | null;
  unit: string;
  emoji: string;
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
    stores: [{
      store: '',
      price: 0,
      date: new Date().toISOString().split('T')[0]
    }],
    target_price: null,
    unit: 'pcs',
    emoji: '🛒'
  });
  const [draggedItem, setDraggedItem] = useState<PriceEntry | null>(null);
  const [dragOverItem, setDragOverItem] = useState<PriceEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const loadPriceData = async () => {
      setIsLoading(true);
      try {
        const { data: priceData, error } = await database.priceTracker.getAll(user.id);
        if (error) throw error;
        
        const formattedData = (priceData || []).map(item => {
          // Debug: Log stores data to check receipt_image
          if (item.stores && item.stores.length > 0) {
            console.log(`Price tracker item ${item.name} stores:`, item.stores);
          }
          return {
            id: item.id,
            name: item.name,
            stores: item.stores || [],
            target_price: item.target_price,
            unit: item.unit,
            emoji: item.emoji || '🛒'
          };
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

  // Get all unique merchants from all stores
  const merchants = ['all', ...Array.from(new Set(
    priceHistory.flatMap(item => 
      item.stores.map(store => store.store)
    )
  ))];

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
        item.stores.some(store => store.store === selectedMerchant);
      return matchesSearch && matchesMerchant;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const aLatest = Math.max(...a.stores.map(s => new Date(s.date).getTime()));
          const bLatest = Math.max(...b.stores.map(s => new Date(s.date).getTime()));
          return bLatest - aLatest;
        case 'price':
          const aLowest = Math.min(...a.stores.map(s => s.price));
          const bLowest = Math.min(...b.stores.map(s => s.price));
          return bLowest - aLowest;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const updatePriceEntry = async (updatedEntry: PriceEntry) => {
    if (!user) return;
    
    try {
      const updates = {
        name: updatedEntry.name,
        stores: updatedEntry.stores,
        target_price: updatedEntry.target_price,
        unit: updatedEntry.unit,
        emoji: updatedEntry.emoji
      };
      
      const { error } = await database.priceTracker.update(updatedEntry.id, user.id, updates);
      if (error) throw error;
      
      const updatedHistory = priceHistory.map(item =>
        item.id === updatedEntry.id ? updatedEntry : item
      );
      setPriceHistory(updatedHistory);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating price entry:', error);
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

  // Calculate price trends for items
  const getPriceTrend = (item: PriceEntry) => {
    if (item.stores.length < 2) return null;
    
    const sortedPrices = item.stores
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(store => store.price);
    
    const lastPrice = sortedPrices[sortedPrices.length - 1];
    const previousPrice = sortedPrices[sortedPrices.length - 2];
    const change = ((lastPrice - previousPrice) / previousPrice) * 100;
    
    return { change, trend: change > 0 ? 'up' : 'down' };
  };

  // Get lowest current price
  const getLowestPrice = (item: PriceEntry) => {
    if (item.stores.length === 0) return null;
    return Math.min(...item.stores.map(store => store.price));
  };

  // Get lowest price store info with quantity
  const getLowestPriceInfo = (item: PriceEntry) => {
    if (item.stores.length === 0) return null;
    
    const lowestStore = item.stores.reduce((lowest, store) => {
      if (!lowest || store.price < lowest.price) {
        return store;
      }
      return lowest;
    }, null as typeof item.stores[0] | null);
    
    return lowestStore;
  };

  // Get latest store info
  const getLatestStore = (item: PriceEntry) => {
    if (item.stores.length === 0) return null;
    return item.stores.reduce((latest, store) => 
      new Date(store.date) > new Date(latest.date) ? store : latest
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items Tracked</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{priceHistory.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Store Prices</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {priceHistory.reduce((sum, item) => sum + item.stores.length, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Savings Potential</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {priceHistory.length > 0 ? (
                  `$${(priceHistory.reduce((sum, item) => {
                    if (item.stores.length < 2) return sum;
                    const prices = item.stores.map(s => s.price);
                    return sum + (Math.max(...prices) - Math.min(...prices));
                  }, 0) / priceHistory.length).toFixed(2)}`
                ) : '$0.00'}
              </div>
            </CardContent>
          </Card>
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
              {merchants.map(merchant => (
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
                      stores: [{
                        store: '',
                        price: 0,
                        date: new Date().toISOString().split('T')[0]
                      }],
                      target_price: null,
                      unit: 'pcs',
                      emoji: '🛒'
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
                const trend = getPriceTrend(item);
                const lowestPrice = getLowestPrice(item);
                const lowestPriceInfo = getLowestPriceInfo(item);
                const latestStore = getLatestStore(item);
                
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
                              <span className={`flex items-center text-xs ${trend.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                                {trend.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(trend.change).toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.stores.length} store{item.stores.length !== 1 ? 's' : ''} • {item.unit}
                            {item.target_price && (
                              <span className="ml-2">
                                Target: ${item.target_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile: Stack price and merchant info vertically */}
                      <div className="mt-2 sm:mt-0 sm:flex sm:items-center sm:gap-4">
                        {/* Lowest Price with View button on mobile */}
                        {lowestPriceInfo && (
                          <div className="flex items-center justify-between sm:block sm:text-right sm:mx-4">
                            <div>
                              <div className="font-semibold">
                                ${lowestPriceInfo.total_price?.toFixed(2) || lowestPriceInfo.price.toFixed(2)} for {lowestPriceInfo.quantity || 1} {item.unit}
                              </div>
                              <div className="text-xs text-gray-500">
                                Lowest price
                              </div>
                            </div>
                            {!isEditMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const storeWithReceipt = item.stores && item.stores.length > 0 
                                    ? item.stores
                                        .filter(store => store.receipt_image)
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                                    : null;
                                  
                                  if (storeWithReceipt?.receipt_image) {
                                    setShowReceiptImage(storeWithReceipt.receipt_image);
                                  } else {
                                    showToast('No receipt image available for this item', 'info');
                                  }
                                }}
                                className="h-8 w-8 p-0 sm:hidden"
                                title="View Receipt"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Latest Store with Edit button on mobile */}
                        {latestStore && (
                          <div className="flex items-center justify-between sm:block sm:w-32 sm:text-center mt-1 sm:mt-0">
                            <div>
                              <div className="font-medium text-sm">{latestStore.store}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(latestStore.date).toLocaleDateString()}
                              </div>
                            </div>
                            {!isEditMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingItem(item)}
                                className="h-8 w-8 p-0 sm:hidden"
                                title="Edit Item"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Actions - Desktop only */}
                        {!isEditMode && (
                          <div className="hidden sm:flex flex-col items-center gap-1 sm:ml-4">
                            {/* View Receipt Button - Always show */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Find if any store has a receipt image
                                const storeWithReceipt = item.stores && item.stores.length > 0 
                                  ? item.stores
                                      .filter(store => store.receipt_image)
                                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                                  : null;
                                
                                if (storeWithReceipt?.receipt_image) {
                                  setShowReceiptImage(storeWithReceipt.receipt_image);
                                } else {
                                  // Show a toast when no receipt is available
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
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Price Tracker Item</DialogTitle>
                <DialogDescription>
                  Update the details and store prices for this item
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
                
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="editTargetPrice">Target Price</Label>
                    <Input
                      id="editTargetPrice"
                      type="number"
                      step="0.01"
                      value={editingItem.target_price || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem, 
                        target_price: e.target.value ? parseFloat(e.target.value) : null
                      })}
                    />
                  </div>
                </div>

                {/* Store Prices */}
                <div>
                  <Label>Store Prices</Label>
                  <div className="space-y-2 mt-2">
                    {editingItem.stores.map((store, index) => (
                      <div key={index} className="p-3 border rounded space-y-2">
                        <Input
                          placeholder="Store name"
                          value={store.store}
                          onChange={(e) => {
                            const newStores = [...editingItem.stores];
                            newStores[index] = {...store, store: e.target.value};
                            setEditingItem({...editingItem, stores: newStores});
                          }}
                          className="w-full"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={store.price}
                            onChange={(e) => {
                              const newStores = [...editingItem.stores];
                              newStores[index] = {...store, price: parseFloat(e.target.value) || 0};
                              setEditingItem({...editingItem, stores: newStores});
                            }}
                          />
                          <Input
                            type="date"
                            value={store.date}
                            onChange={(e) => {
                              const newStores = [...editingItem.stores];
                              newStores[index] = {...store, date: e.target.value};
                              setEditingItem({...editingItem, stores: newStores});
                            }}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newStores = editingItem.stores.filter((_, i) => i !== index);
                              setEditingItem({...editingItem, stores: newStores});
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingItem({
                          ...editingItem,
                          stores: [
                            ...editingItem.stores,
                            { store: '', price: 0, date: new Date().toISOString().split('T')[0] }
                          ]
                        });
                      }}
                    >
                      Add Store Price
                    </Button>
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
                    <Label htmlFor="newTargetPrice">Target Price (Optional)</Label>
                    <Input
                      id="newTargetPrice"
                      type="number"
                      step="0.01"
                      value={newItem.target_price || ''}
                      onChange={(e) => setNewItem({
                        ...newItem, 
                        target_price: e.target.value ? parseFloat(e.target.value) : null
                      })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Store Prices */}
                <div>
                  <Label>Initial Store Price</Label>
                  <div className="p-3 border rounded space-y-2 mt-2">
                    <Input
                      placeholder="Store name"
                      value={newItem.stores[0].store}
                      onChange={(e) => {
                        const newStores = [...newItem.stores];
                        newStores[0] = {...newStores[0], store: e.target.value};
                        setNewItem({...newItem, stores: newStores});
                      }}
                      className="w-full"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={newItem.stores[0].price || ''}
                        onChange={(e) => {
                          const newStores = [...newItem.stores];
                          newStores[0] = {...newStores[0], price: parseFloat(e.target.value) || 0};
                          setNewItem({...newItem, stores: newStores});
                        }}
                      />
                      <Input
                        type="date"
                        value={newItem.stores[0].date}
                        onChange={(e) => {
                          const newStores = [...newItem.stores];
                          newStores[0] = {...newStores[0], date: e.target.value};
                          setNewItem({...newItem, stores: newStores});
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={async () => {
                      if (!user || !newItem.name || !newItem.stores[0].store) {
                        showToast('Please fill in all required fields', 'error');
                        return;
                      }
                      
                      try {
                        const { error } = await database.priceTracker.add(user.id, {
                          name: newItem.name,
                          stores: newItem.stores.filter(s => s.store && s.price > 0),
                          target_price: newItem.target_price,
                          unit: newItem.unit,
                          emoji: newItem.emoji
                        });
                        
                        if (error) throw error;
                        
                        showToast('Item added successfully', 'success');
                        setIsAddingItem(false);
                        
                        // Reload price history
                        const { data: priceData } = await database.priceTracker.getAll(user.id);
                        setPriceHistory(priceData?.map(item => ({
                          id: item.id,
                          name: item.name,
                          stores: item.stores || [],
                          target_price: item.target_price,
                          unit: item.unit,
                          emoji: item.emoji || '🛒'
                        })) || []);
                      } catch (error) {
                        console.error('Error adding item:', error);
                        showToast('Failed to add item', 'error');
                      }
                    }} 
                    className="flex-1"
                    disabled={!newItem.name || !newItem.stores[0].store}
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