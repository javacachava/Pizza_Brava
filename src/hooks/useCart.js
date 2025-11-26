import { useState, useMemo } from 'react';

export function useCart() {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prev => {
      // 1. Identificador único (si viene del modal usa cartItemId, sino id normal)
      const uniqueId = item.cartItemId || item.id;
      
      // 2. Buscar índice si ya existe
      const existingIndex = prev.findIndex(i => {
          // Si es un producto configurado (pizza armada), comparar por ID único
          if (item.isConfigured) return i.cartItemId === uniqueId;
          // Si es producto simple (soda), comparar ID y que no sea configurado
          return i.id === item.id && !i.isConfigured;
      });

      if (existingIndex >= 0) {
        // === CORRECCIÓN DEL BUG (+2) ===
        // Creamos una copia NUEVA del array
        const newCart = [...prev];
        // Y lo más importante: Creamos una copia NUEVA del objeto item
        // Antes modificabas newCart[existingIndex].qty += 1 directamente (error)
        newCart[existingIndex] = {
            ...newCart[existingIndex],
            qty: newCart[existingIndex].qty + 1
        };
        return newCart;
      } else {
        // Agregar nuevo item
        return [...prev, { ...item, cartItemId: uniqueId, qty: 1 }];
      }
    });
  };

  const removeFromCart = (itemToRemove) => {
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
          // Si baja de 1 se elimina, sino devuelve objeto nuevo actualizado
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