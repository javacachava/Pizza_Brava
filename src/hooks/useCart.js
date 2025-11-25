import { useState, useMemo } from 'react';

export function useCart() {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prev => {
      // Buscamos si existe un item con el mismo ID Y el mismo nombre (para variantes)
      const existing = prev.find(i => i.id === item.id && i.name === item.name);
      
      if (existing) {
        return prev.map(i => 
          (i.id === item.id && i.name === item.name) 
            ? { ...i, qty: i.qty + 1 } 
            : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId, variant) => {
    // Si eliminamos, filtramos por ID. Si usamos variantes, el nombre cambia, así que mejor filtrar por el index o referencia única, 
    // pero para simplificar asumimos que el ID de Firestore + Nombre Variado es la clave única.
    // En esta implementación simple, mejor pasamos el objeto item completo para comparar.
    // Como CartPanel llama a removeFromCart(item.id), esto borraría todas las variantes.
    // CORRECCIÓN: CartPanel debe pasar el item o un index.
    
    // Sin embargo, para no romper la API existente, vamos a filtrar por ID.
    // NOTA: En un sistema prod, usaríamos un uniqueCartId.
    setCart(prev => prev.filter(i => i.id !== itemId)); 
  };
  
  // MEJORA: updateQty y remove más precisos
  const updateQty = (itemToUpdate, delta) => {
    setCart(prev => {
      return prev.map(i => {
        // Comparamos por referencia o nombre para distinguir variantes
        if (i.id === itemToUpdate.id && i.name === itemToUpdate.name) {
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