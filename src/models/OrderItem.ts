export interface ComboSlotSelection {
slotId: string;
productId: string;
productName: string;
quantity: number;
unitPrice: number;
}


export interface OrderItem {
productId: string;
productName: string;
quantity: number;
unitPrice: number;
totalPrice: number;
comment?: string;
selectedOptions?: { name: string; price: number }[];
isCombo?: boolean;
comboDefinitionId?: string; 
comboSlots?: ComboSlotSelection[]; 
}