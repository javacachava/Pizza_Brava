import { useState, useMemo } from 'react';

export function useCart() {
  const [cart, setCart] = useState([]);

  // Función para agregar item (maneja productos simples y configurados)
  const addToCart = (product) => {
    setCart(prev => {
      // Generar un ID único para el carrito si no viene uno (para productos simples)
      const uniqueId = product.cartItemId || product.id; 
      
      // Buscar si ya existe EXACTAMENTE el mismo item (mismo ID de producto Y mismos ingredientes/configuración)
      // Para simplificar, si tiene 'cartItemId' (viene del modal), es único y se agrega aparte (o se busca por ese ID específico).
      // Si es producto simple (refresco), se busca por product.id
      
      let existingIndex = -1;

      if (product.isConfigured) {
         // Si es configurado, buscamos por su ID único de configuración
         existingIndex = prev.findIndex(i => i.cartItemId === uniqueId);
      } else {
         // Si es simple, buscamos por ID de base
         existingIndex = prev.findIndex(i => i.id === product.id && !i.isConfigured);
      }
      
      if (existingIndex >= 0) {
        // Si existe, clonamos y aumentamos cantidad
        const newCart = [...prev];
        newCart[existingIndex].qty += 1;
        return newCart;
      } else {
        // Si no, agregamos nuevo con qty 1
        return [...prev, { ...product, cartItemId: uniqueId, qty: 1 }];
      }
    });
  };

  const removeFromCart = (itemToRemove) => {
     // Usamos el identificador único que definimos al agregar
     const targetId = itemToRemove.cartItemId || itemToRemove.id;
     setCart(prev => prev.filter(i => (i.cartItemId || i.id) !== targetId));
  };
  
  const updateQty = (itemToUpdate, delta) => {
    const targetId = itemToUpdate.cartItemId || itemToUpdate.id;

    setCart(prev => {
      return prev.map(i => {
        const currentId = i.cartItemId || i.id;
        if (currentId === targetId) {
          const newQty = i.qty + delta;
          return newQty <= 0 ? null : { ...i, qty: newQty };
        }
        return i;
      }).filter(Boolean);
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
  }, [cart]);

  return { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal };
}