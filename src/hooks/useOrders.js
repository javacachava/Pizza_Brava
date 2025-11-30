// src/hooks/useOrders.js
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
  increment
} from "firebase/firestore";
import { db } from "../services/firebase";
import { toast } from "react-hot-toast";
import { ROLES, STATUS, SYNC_STATUS } from "../constants/types";

// HELPER: Obtener fecha local en formato YYYY-MM-DD
const getLocalDateStr = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split("T")[0];
};

export function useOrders() {
  const [loading, setLoading] = useState(false);

  // Genera número correlativo por día
  const generateOrderNumber = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { number: "PENDIENTE", isOffline: true };
    }

    const todayStr = getLocalDateStr();
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
      return { number: "PENDIENTE", isOffline: true };
    }
  };

  const buildItemsSnapshot = (cartItems = []) =>
    cartItems.map((item) => ({
      id: item.id || "unknown",
      name: item.name || "Sin nombre",
      price: Number(item.price || 0),
      qty: Number(item.qty || 1),
      mainCategory: item.mainCategory || "Otros",
      total: Number((Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)),
      details: Array.isArray(item.details) ? item.details : [],
    }));

  const saveOrder = async ({ orderData, cartItems }) => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("El carrito está vacío");
      return null;
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
        items: itemsSnapshot,
        createdAt: serverTimestamp(),
        createdBy: orderData?.createdBy || ROLES.RECEPTION,
        status: orderData?.status || STATUS.NEW,
        syncStatus: isOffline ? SYNC_STATUS.PENDING : SYNC_STATUS.SYNCED,
      };

      // 1) Orden principal
      batch.set(newOrderRef, payload);

      // 2) Subcolección de items
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

      // 3) Estadísticas diarias (CLIENT SIDE - Temporal sin Cloud Functions)
      if (!isOffline) {
        const todayStr = getLocalDateStr();
        const statsRef = doc(db, "daily_stats", todayStr);

        const categoryIncrements = {};
        itemsSnapshot.forEach((item) => {
          const catName = item.mainCategory || "Otros";
          const field = `categoryBreakdown.${catName}`;
          categoryIncrements[field] = increment(item.total);
        });

        const payMethod = orderData.paymentMethod || "otro"; 
        const payMethodSalesField = `paymentBreakdown.${payMethod}.sales`;
        const payMethodCountField = `paymentBreakdown.${payMethod}.count`;

        const productIncrements = {};
        itemsSnapshot.forEach((item) => {
          const safeId = (item.id || "unknown").replace(/\//g, "_").replace(/\./g, "_");
          const fieldSales = `productBreakdown.${safeId}.sales`;
          const fieldQty = `productBreakdown.${safeId}.qty`;
          const fieldName = `productBreakdown.${safeId}.name`; 
          
          productIncrements[fieldSales] = increment(item.total);
          productIncrements[fieldQty] = increment(item.qty);
          productIncrements[fieldName] = item.name; 
        });

        batch.set(
          statsRef,
          {
            date: todayStr,
            totalSales: increment(normalizedTotal),
            totalOrders: increment(1),
            ...categoryIncrements,
            [payMethodSalesField]: increment(normalizedTotal),
            [payMethodCountField]: increment(1),
            ...productIncrements
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

  // --- REGLA: RETENCIÓN DE 1 MES ---
  const archiveOldOrders = async () => {
    setLoading(true);
    try {
      const limitDate = new Date();
      // Se eliminan órdenes de más de 30 días
      limitDate.setDate(limitDate.getDate() - 30);

      const q = query(
        collection(db, "orders"),
        where("createdAt", "<", limitDate),
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