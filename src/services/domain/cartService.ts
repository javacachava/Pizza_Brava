import type { OrderItem } from '../../models/OrderItem';
import type { MenuItem } from '../../models/MenuItem';
import type { ComboDefinition } from '../../models/ComboDefinition';
import { generateId } from '../../utils/id';

export const cartService = {
  createItemFromProduct(product: MenuItem, quantity: number = 1, notes: string = ''): OrderItem {
    return {
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      comment: notes,
      isCombo: false,
      selectedOptions: []
    };
  },

  createItemFromCombo(
    definition: ComboDefinition, 
    selections: any[] 
  ): OrderItem {
    // Generamos ID aquí, pero NO lo usaremos para comparar igualdad
    const instanceId = generateId();
    return {
      productId: null, 
      productName: definition.name,
      quantity: 1,
      unitPrice: definition.price,
      totalPrice: definition.price,
      isCombo: true,
      comment: '',
      combo: {
        id: instanceId, // Este ID es único por instancia
        comboDefinitionId: definition.id, // Este ID es el que define "qué es"
        name: definition.name,
        price: definition.price,
        items: selections
      },
      selectedOptions: []
    };
  },

  recalculateItem(item: OrderItem): OrderItem {
    return {
      ...item,
      totalPrice: item.unitPrice * item.quantity
    };
  },

  /**
   * Agrega item evitando duplicados visuales.
   * Compara profundamente el contenido, ignorando IDs transaccionales.
   */
  addItem(cart: OrderItem[], newItem: OrderItem): OrderItem[] {
    const existingIndex = cart.findIndex(item => {
      // 1. Verificar si es el mismo producto base o definición de combo
      const sameProduct = item.productId === newItem.productId;
      const sameComboDef = item.isCombo && newItem.isCombo && item.combo?.comboDefinitionId === newItem.combo?.comboDefinitionId;
      
      if (!sameProduct && !sameComboDef) return false;

      // 2. Verificar notas/comentarios iguales
      if ((item.comment || '') !== (newItem.comment || '')) return false;

      // 3. Verificar opciones seleccionadas (Ingredientes, etc.)
      // Simplificado: Stringify de opciones ordenadas
      const opts1 = JSON.stringify(item.selectedOptions?.sort((a,b) => a.id.localeCompare(b.id)));
      const opts2 = JSON.stringify(newItem.selectedOptions?.sort((a,b) => a.id.localeCompare(b.id)));
      if (opts1 !== opts2) return false;

      // 4. Si es combo, verificar que lleve lo mismo por dentro (Bebida, Pizza exacta, etc)
      if (item.isCombo) {
        const items1 = JSON.stringify(item.combo?.items); // Asumiendo estructura determinista
        const items2 = JSON.stringify(newItem.combo?.items);
        if (items1 !== items2) return false;
      }

      return true;
    });

    if (existingIndex >= 0) {
      // Si es idéntico, solo sumamos cantidad
      return this.updateQuantity(cart, existingIndex, newItem.quantity);
    }

    // Si es diferente, nueva línea
    return [...cart, newItem];
  },

  updateQuantity(cart: OrderItem[], index: number, delta: number): OrderItem[] {
    if (index < 0 || index >= cart.length) return cart;

    const newCart = [...cart];
    const item = { ...newCart[index] };
    const newQty = item.quantity + delta;

    if (newQty < 1) return cart; 

    item.quantity = newQty;
    newCart[index] = this.recalculateItem(item);
    
    return newCart;
  },

  removeItem(cart: OrderItem[], index: number): OrderItem[] {
    return cart.filter((_, i) => i !== index);
  },

  calculateTotal(cart: OrderItem[]): number {
    return cart.reduce((acc, item) => acc + item.totalPrice, 0);
  }
};