export interface ComboGroupDef {
  id: string;
  title: string;
  required: boolean;
  limit: number;
  allowedCategoryIds?: string[];
  allowedProductIds?: string[];
}

export interface ComboDefinition {
  id: string;
  name: string;
  basePrice: number;
  isActive?: boolean;
  groups: ComboGroupDef[];
  description?: string;
}
