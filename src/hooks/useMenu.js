import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

export function useMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadMenu = async () => {
      setLoading(true);
      setError(null);

      try {
        const snap = await getDocs(collection(db, "menuItems"));

        let items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // --- FILTRADO ESTRICTO: activo + stock ---
        items = items.filter((item) => {
          // 1. Debe estar activo (isActive === false -> fuera)
          if (item.isActive === false) return false;

          // 2. Control de stock
          // Tomamos stock de donde lo estés guardando
          const rawStock =
            item.stock !== undefined && item.stock !== null
              ? item.stock
              : item.currentStock; // opcional: otro nombre

          // Si no hay campo de stock, asumimos infinito (se muestra)
          if (rawStock === undefined || rawStock === null || rawStock === "") {
            return true;
          }

          const stockNumber = Number(rawStock);

          // Si no es un número válido, por seguridad lo mostramos
          if (Number.isNaN(stockNumber)) return true;

          // Solo se muestra si stock > 0
          return stockNumber > 0;
        });

        // --- NORMALIZACIÓN PARA LA UI ---
        items = items.map((item) => ({
          ...item,
          mainCategory: item.mainCategory || "Otros",
          station: item.station || "cocina",
          type:
            item.type ||
            (item.isCombo
              ? "combo"
              : item.mainCategory === "Pizzas"
              ? "pizza_simple"
              : "simple"),
        }));

        // --- ORDEN ---
        items.sort((a, b) => {
          if (a.mainCategory === b.mainCategory) {
            return (a.name || "").localeCompare(b.name || "");
          }
          return (a.mainCategory || "").localeCompare(b.mainCategory || "");
        });

        if (!cancelled) {
          setMenuItems(items);
        }
      } catch (err) {
        console.error("Error al cargar menú:", err);
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  return { menuItems, loading, error };
}
