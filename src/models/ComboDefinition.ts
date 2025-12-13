import type { ID } from './SharedTypes';

export interface ComboRules {
  allowCustomChoice: boolean;
  maxPizzas: number;
  maxDrinks: number;
  maxSides: number;
}

export interface ComboSlot {
  id: string;
  name: string;
  max: number;
  // Agregadas para compatibilidad con utils/combo.ts
  min?: number; 
  required?: boolean | string; // Puede ser 'required' (string) según tu validador
  allowedProductIds: ID[];
}

export interface ComboDefinition {
  id: ID;
  categoryId: string; // "combos"
  name: string;
  description?: string;
  price: number;        // Nota: Se llama 'price', no 'basePrice'
  isAvailable: boolean;
  itemsIncluded: string[]; 
  rules: ComboRules;
  slots?: ComboSlot[]; 
}