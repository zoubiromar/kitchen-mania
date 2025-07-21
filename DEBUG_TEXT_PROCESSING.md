# Text Processing Debug Guide

## If "Process Items" Button Does Nothing:

### 1. Check Browser Console (F12)
Look for errors like:
- Network errors (failed API calls)
- JavaScript errors
- CORS issues

### 2. Common Issues & Solutions:

#### Issue: No OpenAI API Key
**Symptom**: Falls back to simple parsing
**Solution**: The app should still work with simple parsing. Format:
```
2 eggs
1 liter milk
3 tomatoes
```

#### Issue: Empty Pantry Problem
**Status**: FIXED - New users now get default items
**Previous Issue**: Empty pantry array caused parsing problems

#### Issue: No Visual Feedback
**Status**: FIXED - Added toast notifications:
- "Processing items..." when started
- Success/error messages when complete
- Shows item count found

### 3. Test These Formats:
```
// Simple format (works with fallback parser)
5 eggs
2 litre milk
3 tomatoes
1 onion

// With units
2 lbs chicken
500g pasta
1 dozen eggs

// Mixed format
eggs - 12
milk (1 gallon)
bread x2
```

### 4. Expected Flow:
1. Enter text → Click "Process Items"
2. See "Processing items..." toast
3. Either:
   - Bulk dialog appears with items
   - Error message if no items found

### 5. To Debug Further:
1. Open browser console
2. Type items and click process
3. Check for:
   - Network tab: `/api/pantry/parse-text` request
   - Console tab: Any errors
   - Response: What the API returned

If still not working, the issue might be:
- API endpoint not deployed
- Network/firewall blocking
- Browser extensions interfering 