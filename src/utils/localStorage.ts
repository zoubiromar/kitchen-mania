// Utility functions for managing localStorage with quota handling

export const STORAGE_KEYS = {
  PANTRY_ITEMS: 'pantryItems',
  SAVED_RECIPES: 'savedRecipes',
  PRICE_TRACKER: 'priceTracker',
  RECEIPTS: 'receipts'
} as const;

// Get approximate size of localStorage in bytes
export function getStorageSize(): number {
  let totalSize = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  return totalSize;
}

// Get size of a specific key in bytes
export function getKeySize(key: string): number {
  const item = localStorage.getItem(key);
  return item ? item.length + key.length : 0;
}

// Clean up old data from a specific key (keeps most recent items)
export function cleanupOldData(key: string, maxItems: number = 100): void {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(data) && data.length > maxItems) {
      // Sort by date or ID (most recent first) and keep only maxItems
      const sorted = data.sort((a: any, b: any) => {
        const dateA = a.date || a.createdAt || a.id || 0;
        const dateB = b.date || b.createdAt || b.id || 0;
        return dateB > dateA ? 1 : -1;
      });
      
      const trimmed = sorted.slice(0, maxItems);
      localStorage.setItem(key, JSON.stringify(trimmed));
    }
  } catch (error) {
    console.error(`Error cleaning up ${key}:`, error);
  }
}

// Save data with automatic cleanup on quota errors
export function safeSetItem(key: string, value: string, maxRetries: number = 3): boolean {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        retries++;
        
        // Try different cleanup strategies
        if (retries === 1) {
          // First, try to clean up the specific key
          cleanupOldData(key, 50);
        } else if (retries === 2) {
          // Then, clean up all data keys
          cleanupOldData(STORAGE_KEYS.RECEIPTS, 30);
          cleanupOldData(STORAGE_KEYS.PRICE_TRACKER, 100);
        } else {
          // Last resort: clear receipts images
          try {
            const receipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
            const receiptsWithoutImages = receipts.map((r: any) => ({
              ...r,
              image: undefined // Remove image data
            }));
            localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receiptsWithoutImages));
          } catch (e) {
            console.error('Failed to clear receipt images:', e);
          }
        }
      } else {
        console.error('Storage error:', error);
        return false;
      }
    }
  }
  
  return false;
}

// Get storage usage percentage (approximate)
export function getStorageUsagePercent(): number {
  const currentSize = getStorageSize();
  const estimatedMax = 5 * 1024 * 1024; // 5MB (conservative estimate)
  return Math.min((currentSize / estimatedMax) * 100, 100);
}

// Save receipt without image or with compressed data
export function saveReceiptData(receipt: any): boolean {
  try {
    const existingReceipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
    
    // Store receipt without the full image
    const receiptToStore = {
      ...receipt,
      image: undefined, // Don't store the base64 image
      hasImage: !!receipt.image // Just mark that it had an image
    };
    
    const updatedReceipts = [...existingReceipts, receiptToStore];
    return safeSetItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(updatedReceipts));
  } catch (error) {
    console.error('Error saving receipt:', error);
    return false;
  }
}

// Save price data with automatic cleanup
export function savePriceData(priceData: any[]): boolean {
  try {
    const existingData = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRICE_TRACKER) || '[]');
    const updatedData = [...existingData, ...priceData];
    return safeSetItem(STORAGE_KEYS.PRICE_TRACKER, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error saving price data:', error);
    return false;
  }
} 