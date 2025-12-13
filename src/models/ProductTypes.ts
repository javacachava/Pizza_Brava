import type { MenuItem } from './MenuItem';

// Enumeración de comportamientos
export type ProductBehavior = 'SIMPLE_VARIANT' | 'COMBO_PACK' | 'CUSTOM_BUILDER' | 'STANDARD';

// --- Interfaces para UI ---
export interface VariantOption {
  id: string;
  name: string;
  priceModifier?: number;
}

export interface VariantGroup {
  id: string;
  name: string;
  options: VariantOption[];
}

export interface ComboOption {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface ComboSlot {
  id: string;
  title: string;
  isRequired: boolean;
  isSwappable: boolean;
  options: ComboOption[];
  defaultOptionId: string;
}

export interface Ingredient {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
  image?: string;
}

// --- EXTENSIÓN DEL MODELO MENUITEM ---
// Usamos "ProductUI" para diferenciarlo del MenuItem de la DB
export interface ProductUI extends MenuItem {
  behavior: ProductBehavior;
  
  // Configuraciones UI (Opcionales)
  variantConfig?: { groups: VariantGroup[] };
  comboConfig?: { slots: ComboSlot[] };
  builderConfig?: { ingredients: Ingredient[] };
}