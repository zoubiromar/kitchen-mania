// Unit conversion utilities

export const METRIC_UNITS = {
  weight: ['kg', 'g', 'mg'],
  volume: ['l', 'ml', 'cl', 'dl'],
  count: ['pcs', 'dozen', 'pack']
};

export const IMPERIAL_UNITS = {
  weight: ['lbs', 'oz'],
  volume: ['gal', 'qt', 'pt', 'cups', 'fl oz', 'tbsp', 'tsp'],
  count: ['pcs', 'dozen', 'pack']
};

export function getPreferredUnit(category: string, unitSystem: 'metric' | 'imperial'): string {
  // Default units based on item category and unit system
  const defaults = {
    metric: {
      Vegetables: 'kg',
      Fruits: 'kg',
      Meat: 'kg',
      Dairy: 'l',
      Grains: 'kg',
      Beverages: 'l',
      Snacks: 'g',
      Condiments: 'ml',
      default: 'pcs'
    },
    imperial: {
      Vegetables: 'lbs',
      Fruits: 'lbs',
      Meat: 'lbs',
      Dairy: 'cups',
      Grains: 'lbs',
      Beverages: 'fl oz',
      Snacks: 'oz',
      Condiments: 'fl oz',
      default: 'pcs'
    }
  };

  return defaults[unitSystem][category as keyof typeof defaults.metric] || defaults[unitSystem].default;
}

export function convertUnit(value: number, fromUnit: string, toUnit: string): number | null {
  // Basic conversion rates
  const conversions: Record<string, Record<string, number>> = {
    // Weight conversions
    'kg': { 'g': 1000, 'lbs': 2.20462, 'oz': 35.274 },
    'g': { 'kg': 0.001, 'oz': 0.035274, 'lbs': 0.00220462 },
    'lbs': { 'kg': 0.453592, 'oz': 16, 'g': 453.592 },
    'oz': { 'lbs': 0.0625, 'g': 28.3495, 'kg': 0.0283495 },
    
    // Volume conversions
    'l': { 'ml': 1000, 'gal': 0.264172, 'fl oz': 33.814, 'cups': 4.22675 },
    'ml': { 'l': 0.001, 'fl oz': 0.033814, 'cups': 0.00422675 },
    'gal': { 'l': 3.78541, 'fl oz': 128, 'cups': 16 },
    'fl oz': { 'ml': 29.5735, 'l': 0.0295735, 'cups': 0.125 },
    'cups': { 'fl oz': 8, 'ml': 236.588, 'l': 0.236588 }
  };

  if (fromUnit === toUnit) return value;
  
  if (conversions[fromUnit] && conversions[fromUnit][toUnit]) {
    return value * conversions[fromUnit][toUnit];
  }
  
  return null; // Cannot convert
} 