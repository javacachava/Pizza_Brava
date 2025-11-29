import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

export function useInventory() {
  const [inventory, setInventory] = useState({
    ingredients: [],
    sides: [],
    drinks: [],
    potatoes: [],
    sauces: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const unsubs = [];

    const attachListener = (collName, key) => {
      const unsub = onSnapshot(
        collection(db, collName),
        (snap) => {
          if (cancelled) return;
          const items = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setInventory((prev) => ({ ...prev, [key]: items }));
          setLoading(false);
        },
        (err) => {
          console.error(`Error cargando ${collName}:`, err);
          if (!cancelled) {
            setError(err);
            setLoading(false);
          }
        }
      );
      unsubs.push(unsub);
    };

    // Colecciones que usamos como inventario
    attachListener("ingredients", "ingredients");
    attachListener("sides", "sides");
    attachListener("drinks", "drinks");
    attachListener("potatoes", "potatoes");
    attachListener("sauces", "sauces");

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u && u());
    };
  }, []);

  const getItemStock = ({ collection: collKey, id }) => {
    const list = inventory[collKey] || [];
    const found = list.find((item) => item.id === id);
    if (!found) return null;

    return {
      stock:
        typeof found.stock === "number" && !Number.isNaN(found.stock)
          ? found.stock
          : null,
      minStock:
        typeof found.minStock === "number" && !Number.isNaN(found.minStock)
          ? found.minStock
          : null,
      isActive: found.isActive !== false,
      raw: found,
    };
  };

  /**
   * checkStock([
   *   { collection: 'ingredients', id: 'jamon', qty: 2 },
   *   { collection: 'sides', id: 'panAjo', qty: 1 }
   * ])
   *
   * Devuelve array de mensajes de error. Si está vacío, todo ok.
   */
  const checkStock = (requirements = []) => {
    const problems = [];

    for (const req of requirements) {
      if (!req || !req.collection || !req.id) continue;

      const info = getItemStock(req);

      if (!info) {
        problems.push(
          `No se encontró inventario para: ${req.collection}/${req.id}`
        );
        continue;
      }

      if (
        info.stock != null &&
        typeof req.qty === "number" &&
        !Number.isNaN(req.qty) &&
        info.stock < req.qty
      ) {
        problems.push(
          `${info.raw.name || req.id}: stock insuficiente (queda ${
            info.stock
          }, se necesitan ${req.qty})`
        );
      }

      if (
        info.stock != null &&
        info.minStock != null &&
        info.stock <= info.minStock
      ) {
        problems.push(
          `${info.raw.name || req.id}: en nivel mínimo (${info.stock} ≤ mínimo ${
            info.minStock
          })`
        );
      }
    }

    return problems;
  };

  return {
    inventory,
    loading,
    error,
    getItemStock,
    checkStock,
  };
}
