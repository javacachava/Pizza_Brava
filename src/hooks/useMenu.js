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

        // Ocultar productos explícitamente desactivados
        items = items.filter((item) => item.isActive !== false);

        // Normalizar campos esperados por la UI
        items = items.map((item) => ({
          ...item,
          mainCategory: item.mainCategory || "Otros",
          station: item.station || "cocina",
          // Tipo útil para ProductDispatcher / combos
          type:
            item.type ||
            (item.isCombo
              ? "combo"
              : item.mainCategory === "Pizzas"
              ? "pizza_simple"
              : "simple"),
        }));

        // Orden básico: por categoría y luego por nombre
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
