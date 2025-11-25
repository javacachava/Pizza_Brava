import { useState, useMemo } from 'react';

export function useCart() {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQty = (itemId, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === itemId) {
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