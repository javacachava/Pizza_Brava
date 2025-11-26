import { useState, useMemo } from 'react';

export function useCart() {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prev => {
      const uniqueId = item.cartItemId || item.id;
      
      const existingIndex = prev.findIndex(i => {
          if (item.isConfigured) return i.cartItemId === uniqueId;
          return i.id === item.id && !i.isConfigured;
      });

      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex] = {
            ...newCart[existingIndex],
            qty: newCart[existingIndex].qty + 1
        };
        return newCart;
      } else {
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
          return newQty <= 0 ? null : { ...i, qty: newQty };
        }
        return i;
      }).filter(Boolean);
    });
  };

  const clearCart = () => setCart([]);

  // --- FIX: MATEMÁTICAS DE PUNTO FLOTANTE ---
  // Redondeamos siempre a 2 decimales para evitar errores de precisión tipo 15.000000001
  const cartTotal = useMemo(() => {
    const rawTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
    return Number(rawTotal.toFixed(2));
  }, [cart]);

  return { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal };
}