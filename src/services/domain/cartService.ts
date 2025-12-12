import type { OrderItem } from '../../models/OrderItem';
import type { MenuItem } from '../../models/MenuItem';
import type { ComboDefinition } from '../../models/ComboDefinition';
import { generateId } from '../../utils/id';

export const cartService = {
  /**
   * Crea un OrderItem a partir de un producto simple.
   */
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

  /**
   * Crea un OrderItem a partir de una definición de combo y sus selecciones.
   * Transforma la "Definición" del menú en una "Instancia" comprada.
   */
  createItemFromCombo(
    definition: ComboDefinition, 
    selections: any[] // Idealmente tipado como ComboItemSelection[]
  ): OrderItem {
    const instanceId = generateId();
    return {
      productId: null, // Es un combo, no un producto base único
      productName: definition.name,
      quantity: 1,
      unitPrice: definition.price,
      totalPrice: definition.price,
      isCombo: true,
      comment: '',
      combo: {
        id: instanceId,
        comboDefinitionId: definition.id,
        name: definition.name,
        price: definition.price,
        items: selections // Items seleccionados dentro del combo
      }
    };
  },

  /**
   * Recalcula el precio total de un item.
   */
  recalculateItem(item: OrderItem): OrderItem {
    return {
      ...item,
      totalPrice: item.unitPrice * item.quantity
    };
  },

  /**
   * Agrega un item al carrito o incrementa si ya existe (solo si es idéntico).
   */
  addItem(cart: OrderItem[], newItem: OrderItem): OrderItem[] {
    // Buscar si existe un item idéntico (mismo ID y mismas opciones/notas)
    const existingIndex = cart.findIndex(item => 
      item.productId === newItem.productId &&
      item.isCombo === newItem.isCombo &&
      JSON.stringify(item.selectedOptions) === JSON.stringify(newItem.selectedOptions) &&
      JSON.stringify(item.combo) === JSON.stringify(newItem.combo) && // Comparación profunda para combos
      item.comment === newItem.comment
    );

    if (existingIndex >= 0) {
      // Si existe, incrementamos cantidad
      return this.updateQuantity(cart, existingIndex, newItem.quantity);
    }

    // Si no, agregamos al final
    return [...cart, newItem];
  },

  /**
   * Actualiza cantidad por índice. Elimina si la cantidad es < 1 explícitamente? 
   * Regla de negocio: Aquí NO eliminamos automáticamente, eso debe ser una acción explícita 'remove'.
   * Pero impedimos bajar de 1.
   */
  updateQuantity(cart: OrderItem[], index: number, delta: number): OrderItem[] {
    if (index < 0 || index >= cart.length) return cart;

    const newCart = [...cart];
    const item = { ...newCart[index] };
    const newQty = item.quantity + delta;

    if (newQty < 1) return cart; // Mínimo 1

    item.quantity = newQty;
    newCart[index] = this.recalculateItem(item);
    
    return newCart;
  },

  /**
   * Elimina un item por índice.
   */
  removeItem(cart: OrderItem[], index: number): OrderItem[] {
    return cart.filter((_, i) => i !== index);
  },

  /**
   * Calcula el total de toda la orden.
   */
  calculateTotal(cart: OrderItem[]): number {
    return cart.reduce((acc, item) => acc + item.totalPrice, 0);
  }
};