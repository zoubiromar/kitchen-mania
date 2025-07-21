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

interface PriceEntry {
  id: string;
  name: string;
  pricePerUnit: number;
  totalPrice: number;
  quantity: number;
  unit: string;
  merchant: string;
  date: string;
  receiptImage?: string;
  emoji?: string;
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
  const [priceHistory, setPriceHistory] = useState<PriceEntry[]>([]);
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [editingItem, setEditingItem] = useState<PriceEntry | null>(null);
  const [showReceiptImage, setShowReceiptImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<PriceEntry | null>(null);
  const [dragOverItem, setDragOverItem] = useState<PriceEntry | null>(null);

  useEffect(() => {
    // Load price history and receipts from localStorage
    const savedPriceData = JSON.parse(localStorage.getItem('priceTracker') || '[]');
    const savedReceipts = JSON.parse(localStorage.getItem('receipts') || '[]');
    setPriceHistory(savedPriceData);
    setReceipts(savedReceipts);
  }, []);

  const merchants = ['all', ...Array.from(new Set(priceHistory.map(item => item.merchant)))];

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
    localStorage.setItem('priceTracker', JSON.stringify(newHistory));
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    const newHistory = priceHistory.filter(item => item.id !== itemId);
    setPriceHistory(newHistory);
    localStorage.setItem('priceTracker', JSON.stringify(newHistory));
  };

  const filteredItems = priceHistory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMerchant = selectedMerchant === 'all' || item.merchant === selectedMerchant;
      return matchesSearch && matchesMerchant;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'price':
          return b.pricePerUnit - a.pricePerUnit;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const updatePriceEntry = (updatedEntry: PriceEntry) => {
    const updatedHistory = priceHistory.map(item =>
      item.id === updatedEntry.id ? updatedEntry : item
    );
    setPriceHistory(updatedHistory);
    localStorage.setItem('priceTracker', JSON.stringify(updatedHistory));
    setEditingItem(null);
  };

  const deletePriceEntry = (id: string) => {
    const updatedHistory = priceHistory.filter(item => item.id !== id);
    setPriceHistory(updatedHistory);
    localStorage.setItem('priceTracker', JSON.stringify(updatedHistory));
  };

  // Calculate price trends for items
  const getPriceTrend = (itemName: string) => {
    const itemPrices = priceHistory
      .filter(item => item.name.toLowerCase() === itemName.toLowerCase())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => item.pricePerUnit);
    
    if (itemPrices.length < 2) return null;
    
    const lastPrice = itemPrices[itemPrices.length - 1];
    const previousPrice = itemPrices[itemPrices.length - 2];
    const change = ((lastPrice - previousPrice) / previousPrice) * 100;
    
    return { change, trend: change > 0 ? 'up' : 'down' };
  };

  // Get emoji from pantry items
  const getItemEmoji = (itemName: string) => {
    const pantryItems = JSON.parse(localStorage.getItem('pantryItems') || '[]');
    const item = pantryItems.find((i: any) => i.name.toLowerCase() === itemName.toLowerCase());
    return item?.emoji || '🛒';
  };

  return (
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
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${priceHistory.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2)}
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
            <SelectItem value="date">Date (Newest)</SelectItem>
            <SelectItem value="price">Price (Highest)</SelectItem>
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
                {isEditMode ? 'Drag items to reorder or click minus to remove' : 'Click on any item to edit details or view receipt'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Done' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const trend = getPriceTrend(item.name);
              const emoji = getItemEmoji(item.name);
              
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
                      <span className="text-2xl">{emoji}</span>
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
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Stack price and merchant info vertically */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                    {/* Price per Unit */}
                    <div className="text-left sm:text-right sm:mx-4">
                      <div className="font-semibold">
                        ${item.pricePerUnit?.toFixed(2) || 'N/A'} per {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Total: ${item.totalPrice?.toFixed(2) || 'N/A'}
                      </div>
                    </div>

                    {/* Merchant */}
                    <div className="text-left sm:w-32 sm:text-center">
                      <div className="font-medium text-sm">{item.merchant}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isEditMode && (
                      <div className="flex gap-2 sm:ml-4 mt-2 sm:mt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {item.receiptImage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowReceiptImage(item.receiptImage!)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Price Entry</DialogTitle>
              <DialogDescription>
                Update the details for this price entry
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
                  <Label htmlFor="editQuantity">Quantity</Label>
                  <Input
                    id="editQuantity"
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({...editingItem, quantity: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="editUnit">Unit</Label>
                  <Input
                    id="editUnit"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editPricePerUnit">Price per Unit</Label>
                  <Input
                    id="editPricePerUnit"
                    type="number"
                    step="0.01"
                    value={editingItem.pricePerUnit}
                    onChange={(e) => setEditingItem({...editingItem, pricePerUnit: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="editTotalPrice">Total Price</Label>
                  <Input
                    id="editTotalPrice"
                    type="number"
                    step="0.01"
                    value={editingItem.totalPrice}
                    onChange={(e) => setEditingItem({...editingItem, totalPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editMerchant">Merchant</Label>
                <Input
                  id="editMerchant"
                  value={editingItem.merchant}
                  onChange={(e) => setEditingItem({...editingItem, merchant: e.target.value})}
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
              <div className="flex gap-2">
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
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setEditingItem(null)}>
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
  );
} 