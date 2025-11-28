import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';

export function useInventory() {
  const [inventory, setInventory] = useState({});

  useEffect(() => {
    // Escucha en tiempo real de múltiples colecciones críticas
    const unsubs = [
      onSnapshot(collection(db, "ingredients"), snap => {
        snap.forEach(d => setInventory(prev => ({...prev, [`ing_${d.id}`]: d.data()})));
      }),
      onSnapshot(collection(db, "sides"), snap => {
        snap.forEach(d => setInventory(prev => ({...prev, [`side_${d.id}`]: d.data()})));
      }),
      // Agregar aquí drinks, sauces, etc.
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const checkStock = (items) => {
    // items es un array de { type: 'ing', id: 'jamon', qty: 1 }
    const errors = [];
    items.forEach(item => {
      const key = `${item.type}_${item.id}`;
      const product = inventory[key];
      if (product && product.stock < item.qty) {
        errors.push(`${product.name}: Stock insuficiente (Queda: ${product.stock})`);
      }
    });
    return errors;
  };

  return { inventory, checkStock };
}