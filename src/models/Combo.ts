export type SlotRequirement = 'optional' | 'required';


export interface ComboSlotDefinition {
id: string; 
name: string; 
required: SlotRequirement; 
min: number; 
max: number; 
allowedCategoryIds?: string[]; 
allowedProductIds?: string[]; 
}


export interface ComboDefinition {
id: string;
name: string;
description?: string;
basePrice: number; 
isAvailable: boolean;
slots: ComboSlotDefinition[];
createdAt?: any;
updatedAt?: any;
}