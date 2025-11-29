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
  limit,
  increment,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { toast } from "react-hot-toast";
import { ROLES, STATUS, SYNC_STATUS } from "../constants/types";

export function useOrders() {
  const [loading, setLoading] = useState(false);

  // Genera número correlativo por día (o "PENDIENTE" si falla)
  const generateOrderNumber = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
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
          lastNumber: nextNumber,
        });

        return nextNumber;
      });

      return { number, isOffline: false };
    } catch (e) {
      console.error("Error generando correlativo:", e);
      // Si falla (permisos / red), seguimos operando con número pendiente
      return { number: "PENDIENTE", isOffline: true };
    }
  };

  const buildItemsSnapshot = (cartItems = []) =>
    cartItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      mainCategory: item.mainCategory || "Otros",
      total: Number((item.price * item.qty).toFixed(2)),
      details: item.details || [], // ingredientes / extras / breakdown combos
    }));

  const saveOrder = async ({ orderData, cartItems }) => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setLoading(true);

    try {
      const { number, isOffline } = await generateOrderNumber();
      const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, "orders"));

      const itemsSnapshot = buildItemsSnapshot(cartItems);
      const computedTotal = itemsSnapshot.reduce(
        (sum, item) => sum + item.total,
        0
      );

      const normalizedTotal = Number(
        (orderData?.total ?? computedTotal).toFixed(2)
      );
      const normalizedSubtotal = Number(
        (orderData?.subtotal ?? normalizedTotal).toFixed(2)
      );

      const payload = {
        ...orderData,
        number,
        total: normalizedTotal,
        subtotal: normalizedSubtotal,
        itemsSnapshot,
        // Alias para reglas de seguridad que usan request.resource.data.items
        items: itemsSnapshot,
        createdAt: serverTimestamp(),
        createdBy: orderData?.createdBy || ROLES.RECEPTION,
        status: orderData?.status || STATUS.NEW,
        syncStatus: isOffline ? SYNC_STATUS.PENDING : SYNC_STATUS.SYNCED,
      };

      // 1) Orden principal
      batch.set(newOrderRef, payload);

      // 2) Subcolección de items (útil para auditoría)
      itemsSnapshot.forEach((item) => {
        const itemRef = doc(collection(db, `orders/${newOrderRef.id}/items`));
        batch.set(itemRef, {
          menuId: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          total: item.total,
          mainCategory: item.mainCategory,
        });
      });

      // 3) Estadísticas diarias (best effort, solo si no estamos en modo "offline/fallo")
      if (!isOffline) {
        const todayStr = new Date().toISOString().split("T")[0];
        const statsRef = doc(db, "daily_stats", todayStr);

        const categoryIncrements = {};
        itemsSnapshot.forEach((item) => {
          const field = `categoryBreakdown.${item.mainCategory}`;
          categoryIncrements[field] = increment(item.total);
        });

        batch.set(
          statsRef,
          {
            date: todayStr,
            totalSales: increment(normalizedTotal),
            totalOrders: increment(1),
            ...categoryIncrements,
          },
          { merge: true }
        );
      }

      await batch.commit();

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

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const archiveRef = doc(db, "archived_orders", docSnap.id);

        batch.set(archiveRef, {
          ...data,
          archivedAt: serverTimestamp(),
        });

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

  return {
    saveOrder,
    updateOrderStatus,
    archiveOldOrders,
    loading,
  };
}
