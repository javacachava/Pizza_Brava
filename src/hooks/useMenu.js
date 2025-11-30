import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

export function useMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Usamos onSnapshot para actualizaciones en tiempo real
    const q = query(collection(db, "menuItems"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // --- FILTRADO ESTRICTO: activo + stock ---
        items = items.filter((item) => {
          // 1. Debe estar activo
          if (item.isActive === false) return false;

          // 2. Control de stock
          const rawStock =
            item.stock !== undefined && item.stock !== null
              ? item.stock
              : item.currentStock;

          // Si no hay campo de stock (undefined/null/vacío), asumimos infinito
          if (rawStock === undefined || rawStock === null || rawStock === "") {
            return true;
          }

          const stockNumber = Number(rawStock);

          // Si no es un número válido, por seguridad lo mostramos (o podrías ocultarlo)
          if (Number.isNaN(stockNumber)) return true;

          // Solo se muestra si stock > 0
          return stockNumber > 0;
        });

        // --- NORMALIZACIÓN ---
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

        setMenuItems(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error al cargar menú:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { menuItems, loading, error };
}