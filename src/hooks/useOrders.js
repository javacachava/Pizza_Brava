import { useState } from "react";
import {
  doc,
  runTransaction,
  serverTimestamp,
  writeBatch,
  collection,
  updateDoc,
  getDocs,
  query,
  where,
  limit
} from "firebase/firestore";
import { db } from "../services/firebase";
import { toast } from "react-hot-toast";
import { ROLES, STATUS } from "../constants/types"; // Importamos constantes

export function useOrders() {
  const [loading, setLoading] = useState(false);

  const generateOrderNumber = async () => {
    if (!navigator.onLine) return { number: "PENDIENTE", isOffline: true };

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

        transaction.set(counterRef, { today: todayStr, lastNumber: nextNumber });
        return nextNumber;
      });
      return { number, isOffline: false };
    } catch (e) {
      console.error("Error transacción:", e);
      return { number: "PENDIENTE", isOffline: true };
    }
  };

  const saveOrder = async ({ orderData, cartItems }) => {
    setLoading(true);
    try {
      const { number, isOffline } = await generateOrderNumber();
      const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, "orders"));

      const itemsSnapshot = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        mainCategory: item.mainCategory || "Otros",
        total: item.price * item.qty,
        details: item.details || [] 
      }));

      const orderPayload = {
        ...orderData,
        number,
        itemsSnapshot,
        createdAt: serverTimestamp(),
        createdBy: ROLES.RECEPTION,
        status: STATUS.NEW, 
        syncStatus: isOffline ? "pending" : "synced"
      };

      batch.set(newOrderRef, orderPayload);

      // Subcolección items (opcional)
      cartItems.forEach((item) => {
        const itemRef = doc(collection(db, `orders/${newOrderRef.id}/items`));
        batch.set(itemRef, {
          menuId: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price
        });
      });

      if (isOffline) {
          batch.commit();
          toast("Guardado localmente (Sin Internet)", { icon: '💾' });
      } else {
          await batch.commit();
      }

      return { number, id: newOrderRef.id, isOffline };
    } catch (error) {
      console.error("Error guardando orden:", error);
      toast.error("No se pudo guardar la orden");
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
      console.error("Error actualizando estado:", error);
      toast.error("Error de conexión");
    }
  };

  // Mueve órdenes viejas a 'archived_orders'
  const archiveOldOrders = async () => {
    setLoading(true);
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const q = query(
            collection(db, "orders"), 
            where("createdAt", "<", ninetyDaysAgo),
            limit(100)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return 0;

        const batch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const archiveRef = doc(db, "archived_orders", docSnap.id);
            batch.set(archiveRef, { ...data, archivedAt: serverTimestamp() });
            batch.delete(docSnap.ref);
            count++;
        });

        await batch.commit();
        return count;
    } catch (e) {
        console.error("Error archivando:", e);
        return 0;
    } finally {
        setLoading(false);
    }
  };

  return { saveOrder, updateOrderStatus, archiveOldOrders, loading };
}