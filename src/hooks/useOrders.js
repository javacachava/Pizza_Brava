import { useState } from 'react';
import { doc, runTransaction, serverTimestamp, writeBatch, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

export function useOrders() {
  const [loading, setLoading] = useState(false);

  const generateOrderNumber = async () => {
    // Generar fecha local (YYYY-MM-DD)
    // Nota: new Date().toISOString() es UTC. Para local simple usamos esto:
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const counterRef = doc(db, "counters", "orders");

    try {
      return await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextNumber = 1;

        if (counterDoc.exists()) {
          const data = counterDoc.data();
          // Si es el mismo día, incrementamos. Si no, reiniciamos a 1.
          if (data.today === todayStr) {
            nextNumber = (data.lastNumber || 0) + 1;
          }
        }
        
        transaction.set(counterRef, { today: todayStr, lastNumber: nextNumber });
        return nextNumber;
      });
    } catch (e) {
      console.error("Error transacción:", e);
      // Fallback seguro
      return Math.floor(Date.now() / 1000) % 10000;
    }
  };

  const saveOrder = async ({ orderData, cartItems }) => {
    setLoading(true);
    try {
      const number = await generateOrderNumber();
      const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, "orders"));

      // Datos del Documento Padre (Resumen + Datos Cliente)
      batch.set(newOrderRef, {
        number,
        type: orderData.orderType, // 'local' | 'telefono'
        customerName: orderData.customerName,
        // Campos opcionales (null si es local)
        phone: orderData.phone || null,
        address: orderData.address || null,
        deliveryNotes: orderData.deliveryNotes || null,
        // Notas generales (cocina o entrega según contexto)
        notes: orderData.notes || '',
        
        subtotal: orderData.subtotal,
        total: orderData.total,
        status: 'nuevo',
        createdAt: serverTimestamp(),
        createdBy: 'recepcion-tablet'
      });

      // Datos de Subcolección Items
      cartItems.forEach(item => {
        const itemRef = doc(collection(db, `orders/${newOrderRef.id}/items`));
        batch.set(itemRef, {
          menuId: item.id,
          name: item.name, // Ya incluye los toppings en el nombre (ej: "Clásica (Jamón)")
          qty: item.qty,
          unitPrice: item.price,
          lineTotal: item.price * item.qty,
          station: item.station,
          status: 'pendiente',
          notes: '', // Notas específicas por item si las hubiera
          // Opcional: guardar array de toppings estructurado si quieres querys avanzadas luego
          selectedToppings: item.selectedToppings || [] 
        });
      });

      await batch.commit();
      return { number, id: newOrderRef.id };
    } catch (error) {
      console.error("Error crítico guardando orden:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { saveOrder, loading };
}