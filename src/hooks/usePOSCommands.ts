import { useState } from 'react';
import { usePOSContext } from '../contexts/POSContext';
import { container } from '../models/di/container';
import type { MenuItem } from '../models/MenuItem';
import type { ComboDefinition } from '../models/ComboDefinition';
import type { OrderItem } from '../models/OrderItem';
import type { Order, OrderType } from '../models/Order';
import { cartService } from '../services/domain/cartService'; // Importamos el dominio
import { orderValidators } from '../utils/validators';
import { generateId } from '../utils/id';
import { toast } from 'react-hot-toast';

export function usePOSCommands() {
  // Consumimos el contexto SOLO para obtener estado y setters base
  const { cart, addOrderItem, updateQuantity, removeIndex, clear } = usePOSContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const ordersService = container.ordersService;

  // --- Comandos de Manipulación del Carrito ---

  const increaseQuantity = (index: number) => {
    // Usamos el servicio de dominio, pero como el estado vive en Context,
    // llamamos a la función del contexto que ya delega (o debería delegar) al servicio.
    // Si el contexto es simple, hacemos la lógica aquí y seteamos completo.
    updateQuantity(index, 1);
  };

  const decreaseQuantity = (index: number) => {
    const item = cart[index];
    if (item && item.quantity > 1) {
      updateQuantity(index, -1);
    } else {
      toast('Usa el botón "Eliminar" para quitar el ítem');
    }
  };

  const removeItem = (index: number) => {
    if (window.confirm('¿Eliminar producto?')) {
      removeIndex(index);
      toast.success('Producto eliminado');
    }
  };

  const clearOrder = () => {
    if (cart.length === 0) return;
    if (window.confirm('¿Estás seguro de BORRAR toda la orden actual?')) {
      clear();
      toast('Orden limpiada', { icon: '🗑️' });
    }
  };

  // --- Comandos de Agregado (Facilitadores) ---

  /**
   * Agrega un producto simple o configurado.
   * Recibe el objeto MenuItem y opcionalmente cantidad/notas.
   */
  const addProductToCart = (product: MenuItem, quantity: number = 1, notes: string = '') => {
    const item = cartService.createItemFromProduct(product, quantity, notes);
    addOrderItem(item);
    toast.success(`${product.name} agregado`);
  };

  /**
   * Recibe un OrderItem ya construido (normalmente desde el Modal de Combos).
   */
  const addComboToCart = (comboItem: OrderItem) => {
    addOrderItem(comboItem);
    toast.success('Combo agregado exitosamente');
  };

  // --- Comando Crítico: Enviar Orden ---

  const submitOrder = async (
    orderType: OrderType,
    meta: {
      tableId?: string;
      tableName?: string;
      customerName?: string;
      phone?: string;
      address?: string;
      note?: string;
    }
  ) => {
    // 1. Validar reglas de negocio antes de tocar la BD
    const validation = orderValidators.validateOrder(cart, orderType, meta);
    if (!validation.isValid) {
      toast.error(validation.error || 'Orden inválida');
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Construir objeto Order final
      const total = cartService.calculateTotal(cart);
      
      const newOrder: Order = {
        id: generateId(),
        items: [...cart], // Snapshot inmutable
        total: total,
        subTotal: total, // Ajustar si hay impuestos
        tax: 0,
        status: 'pendiente',
        orderType: orderType,
        createdAt: new Date() as any, // Ajuste para Timestamp de Firestore
        
        // Mapeo seguro de campos opcionales
        tableNumber: meta.tableId || null,
        customerName: meta.customerName || 'Cliente General',
        
        // Metadatos extendidos para tickets/cocina
        meta: {
          tableName: meta.tableName,
          phone: meta.phone,
          address: meta.address,
          note: meta.note
        }
      };

      // 3. Persistir usando Infraestructura
      await ordersService.createOrder(newOrder);

      // 4. Limpieza y Feedback
      toast.success('¡Orden enviada a Cocina!');
      clear();
      
    } catch (error) {
      console.error('Error al enviar orden:', error);
      toast.error('Error de conexión. No se pudo guardar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    cart,
    isSubmitting,
    cartTotal: cartService.calculateTotal(cart), // Exponemos total calculado
    commands: {
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      clearOrder,
      addProductToCart,
      addComboToCart,
      submitOrder
    }
  };
}