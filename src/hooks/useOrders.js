import { useState } from "react";
import {
  doc,
  runTransaction,
  serverTimestamp,
  writeBatch,
  collection,
  updateDoc
} from "firebase/firestore";
import { db } from "../services/firebase";

export function useOrders() {
  const [loading, setLoading] = useState(false);

  const generateOrderNumber = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const counterRef = doc(db, "counters", "orders");

    try {
      return await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextNumber = 1;

        if (counterDoc.exists()) {
          const data = counterDoc.data();
          if (data.today === todayStr) {
            nextNumber = (data.lastNumber || 0) + 1;
          }
        }

        transaction.set(counterRef, {
          today: todayStr,
          lastNumber: nextNumber
        });
        return nextNumber;
      });
    } catch (e) {
      console.error("Error transacción:", e);
      return Math.floor(Date.now() / 1000) % 10000;
    }
  };

  const saveOrder = async ({ orderData, cartItems }) => {
    setLoading(true);
    try {
      const number = await generateOrderNumber();
      const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, "orders"));

      // OPTIMIZACIÓN PARA ANALÍTICA:
      // Guardamos una copia de los items directamente en la orden principal (itemsSnapshot).
      // Esto evita tener que leer subcolecciones para generar reportes, reduciendo costos y tiempo.
      const itemsSnapshot = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        mainCategory: item.mainCategory || "Otros", // Asegura categoría para reportes
        total: item.price * item.qty
      }));

      batch.set(newOrderRef, {
        ...orderData,
        number,
        itemsSnapshot, // <--- DATA CLAVE PARA REPORTES
        createdAt: serverTimestamp(),
        createdBy: "recepcion-tablet"
      });

      // Mantenemos la subcolección por si se requiere detalle granular o histórico
      cartItems.forEach((item) => {
        const itemRef = doc(collection(db, `orders/${newOrderRef.id}/items`));
        batch.set(itemRef, {
          menuId: item.id,
          name: item.name,
          qty: item.qty,
          unitPrice: item.price,
          lineTotal: item.price * item.qty,
          station: item.station,
          status: "pendiente",
          notes: ""
        });
      });

      await batch.commit();
      return { number, id: newOrderRef.id };
    } catch (error) {
      console.error("Error crítico:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error actualizando orden:", error);
      throw error;
    }
  };

  return { saveOrder, updateOrderStatus, loading };
}