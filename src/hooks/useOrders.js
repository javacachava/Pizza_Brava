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
import { toast } from "react-hot-toast";

export function useOrders() {
  const [loading, setLoading] = useState(false);

  const generateOrderNumber = async () => {
    // Si no hay red, no intentamos la transacción (que fallaría)
    if (!navigator.onLine) {
        return { number: "PENDIENTE", isOffline: true };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const counterRef = doc(db, "counters", "orders");

    try {
      const number = await runTransaction(db, async (transaction) => {
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
      return { number, isOffline: false };
    } catch (e) {
      console.error("Error transacción (posiblemente offline):", e);
      // Fallback seguro si la transacción falla
      return { number: "PENDIENTE", isOffline: true };
    }
  };

  const saveOrder = async ({ orderData, cartItems }) => {
    setLoading(true);
    try {
      // 1. Obtener número (con manejo seguro de offline)
      const { number, isOffline } = await generateOrderNumber();
      
      const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, "orders"));

      const itemsSnapshot = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        mainCategory: item.mainCategory || "Otros",
        total: item.price * item.qty
      }));

      // 2. Preparar datos con flag de sincronización
      const orderPayload = {
        ...orderData,
        number, // Será un número o "PENDIENTE"
        itemsSnapshot,
        createdAt: serverTimestamp(),
        createdBy: "recepcion-tablet",
        syncStatus: isOffline ? "pending" : "synced", // ✅ Nuevo campo
        originalOfflineId: isOffline ? newOrderRef.id : null
      };

      batch.set(newOrderRef, orderPayload);

      // Subcolección (por compatibilidad)
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

      // 3. Escritura optimista
      // Si estamos offline, commit() se resolverá cuando se escriba en IndexedDB,
      // pero no esperamos confirmación del servidor para desbloquear la UI.
      
      if (isOffline) {
          batch.commit(); // "Fire and forget" para la UI
          toast("Guardado en dispositivo (Sin conexión)", { icon: '💾' });
      } else {
          await batch.commit(); // Esperar confirmación real si hay red
      }

      return { number, id: newOrderRef.id, isOffline };

    } catch (error) {
      console.error("Error crítico guardando orden:", error);
      toast.error("No se pudo guardar la orden");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      // Usamos updateDoc normal, si está offline se encola automáticamente
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error actualizando orden:", error);
      toast.error("Error al actualizar estado");
    }
  };

  return { saveOrder, updateOrderStatus, loading };
}