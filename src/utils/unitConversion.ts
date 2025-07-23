// Unit conversion utilities

export interface UnitConversion {
  from: string;
  to: string;
  factor: number;
}

// Define unit conversion factors (all to base unit)
const UNIT_CONVERSIONS: UnitConversion[] = [
  // Weight conversions (base: g)
  { from: 'g', to: 'g', factor: 1 },
  { from: 'kg', to: 'g', factor: 1000 },
  { from: 'mg', to: 'g', factor: 0.001 },
  { from: 'oz', to: 'g', factor: 28.3495 },
  { from: 'lb', to: 'g', factor: 453.592 },
  { from: 'lbs', to: 'g', factor: 453.592 },
  
  // Volume conversions (base: ml)
  { from: 'ml', to: 'ml', factor: 1 },
  { from: 'l', to: 'ml', factor: 1000 },
  { from: 'cl', to: 'ml', factor: 10 },
  { from: 'dl', to: 'ml', factor: 100 },
  { from: 'cup', to: 'ml', factor: 236.588 },
  { from: 'cups', to: 'ml', factor: 236.588 },
  { from: 'tbsp', to: 'ml', factor: 14.7868 },
  { from: 'tsp', to: 'ml', factor: 4.92892 },
  { from: 'fl oz', to: 'ml', factor: 29.5735 },
  { from: 'pint', to: 'ml', factor: 473.176 },
  { from: 'quart', to: 'ml', factor: 946.353 },
  { from: 'gallon', to: 'ml', factor: 3785.41 },
];

// Unit categories for checking if units are compatible
const UNIT_CATEGORIES = {
  weight: ['g', 'kg', 'mg', 'oz', 'lb', 'lbs'],
  volume: ['ml', 'l', 'cl', 'dl', 'cup', 'cups', 'tbsp', 'tsp', 'fl oz', 'pint', 'quart', 'gallon'],
  count: ['pcs', 'pieces', 'items', 'units', 'each'],
  length: ['cm', 'mm', 'm', 'inch', 'ft'],
};

/**
 * Get the category of a unit
 */
export function getUnitCategory(unit: string): string | null {
  const normalizedUnit = unit.toLowerCase().trim();
  
  for (const [category, units] of Object.entries(UNIT_CATEGORIES)) {
    if (units.includes(normalizedUnit)) {
      return category;
    }
  }
  
  return null;
}

/**
 * Check if two units are compatible (can be converted)
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  if (unit1.toLowerCase() === unit2.toLowerCase()) return true;
  
  const category1 = getUnitCategory(unit1);
  const category2 = getUnitCategory(unit2);
  
  return category1 !== null && category1 === category2;
}

/**
 * Convert a quantity from one unit to another
 */
export function convertUnit(quantity: number, fromUnit: string, toUnit: string): number | null {
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();
  
  if (from === to) return quantity;
  
  // Check if units are compatible
  if (!areUnitsCompatible(from, to)) return null;
  
  // Find conversion factors
  const fromConversion = UNIT_CONVERSIONS.find(c => c.from === from);
  const toConversion = UNIT_CONVERSIONS.find(c => c.from === to);
  
  if (!fromConversion || !toConversion) return null;
  
  // Convert through base unit
  const baseQuantity = quantity * fromConversion.factor;
  const convertedQuantity = baseQuantity / toConversion.factor;
  
  // Round to reasonable precision
  return Math.round(convertedQuantity * 100) / 100;
}

/**
 * Add quantities with unit conversion
 * Returns the sum in the unit of the first quantity, or null if incompatible
 */
export function addQuantitiesWithConversion(
  quantity1: number,
  unit1: string,
  quantity2: number,
  unit2: string
): { quantity: number; unit: string } | null {
  if (!areUnitsCompatible(unit1, unit2)) return null;
  
  const convertedQuantity2 = convertUnit(quantity2, unit2, unit1);
  if (convertedQuantity2 === null) return null;
  
  return {
    quantity: quantity1 + convertedQuantity2,
    unit: unit1
  };
}

/**
 * Find the best unit for displaying a quantity
 * (e.g., 1500g -> 1.5kg, 2000ml -> 2l)
 */
export function getBestDisplayUnit(quantity: number, currentUnit: string): { quantity: number; unit: string } {
  const category = getUnitCategory(currentUnit);
  if (!category) return { quantity, unit: currentUnit };
  
  const units = UNIT_CATEGORIES[category as keyof typeof UNIT_CATEGORIES];
  let bestUnit = currentUnit;
  let bestQuantity = quantity;
  
  // Try to find a unit that gives a quantity between 0.1 and 999
  for (const unit of units) {
    const converted = convertUnit(quantity, currentUnit, unit);
    if (converted !== null && converted >= 0.1 && converted < 1000) {
      if (converted < bestQuantity || bestQuantity < 0.1 || bestQuantity >= 1000) {
        bestUnit = unit;
        bestQuantity = converted;
      }
    }
  }
  
  return { quantity: bestQuantity, unit: bestUnit };
} 