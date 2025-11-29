import { useState, useEffect, useMemo } from "react";

const CART_STORAGE_KEY = "pizza_brava_cart_v2";

function safeLoadCart() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error cargando carrito desde localStorage:", e);
    return [];
  }
}

// Construye una “firma” del ítem para poder agrupar productos iguales
// aunque sean objetos distintos en memoria.
function buildSignature(item) {
  if (!item) return "";

  const signature = {
    id: item.id ?? null,
    name: item.name ?? null,
    mainCategory: item.mainCategory ?? null,
    type: item.type ?? null,          // pizza_simple, combo, etc.
    size: item.size ?? null,          // Personal, Grande, etc.
    flavor: item.flavor ?? null,      // sabor de bebida, etc.
    comboId: item.comboId ?? null,    // si viene de un combo
    comboSlotId: item.comboSlotId ?? null,
    isCombo: item.isCombo ?? false,
    // Estructuras de detalle: ingredientes, extras, breakdown de combo
    details: item.details ?? null,
    ingredients: item.ingredients ?? null,
    extras: item.extras ?? null,
  };

  try {
    return JSON.stringify(signature);
  } catch {
    // Si por alguna razón no se puede serializar, caemos a algo random
    return `sig_${item.id || "x"}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

function normalizeItem(raw) {
  const qty = raw?.qty && raw.qty > 0 ? Number(raw.qty) : 1;
  const price = Number(raw?.price ?? 0);
  const mainCategory = raw?.mainCategory || "Otros";
  const type = raw?.type || (raw?.isCombo ? "combo" : "simple");

  const signature = buildSignature({ ...raw, qty: undefined });
  const cartItemId =
    raw?.cartItemId ||
    `${raw?.id || "item"}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

  return {
    ...raw,
    qty,
    price,
    mainCategory,
    type,
    _signature: raw?._signature || signature,
    cartItemId,
  };
}

export function useCart() {
  const [cart, setCart] = useState(() => {
    const loaded = safeLoadCart();
    return loaded.map(normalizeItem);
  });

  // Sincronizar con localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Error guardando carrito en localStorage:", e);
    }
  }, [cart]);

  // Agregar producto al carrito
  const addToCart = (rawItem) => {
    if (!rawItem) return;
    const item = normalizeItem(rawItem);

    setCart((prev) => {
      // Intentar encontrar ítem igual (misma firma)
      const idx = prev.findIndex(
        (p) => p._signature && p._signature === item._signature
      );

      if (idx === -1) {
        return [...prev, item];
      }

      const updated = [...prev];
      const existing = updated[idx];
      updated[idx] = {
        ...existing,
        qty: existing.qty + item.qty,
      };
      return updated;
    });
  };

  // Eliminar producto del carrito (línea completa)
  const removeFromCart = (targetItem) => {
    if (!targetItem) return;

    setCart((prev) =>
      prev.filter(
        (item) =>
          item.cartItemId !== targetItem.cartItemId &&
          item._signature !== targetItem._signature
      )
    );
  };

  // Cambiar cantidad (delta: +1, -1, etc.)
  const updateQty = (targetItem, delta) => {
    if (!targetItem || !delta) return;

    setCart((prev) => {
      return prev
        .map((item) => {
          if (
            item.cartItemId !== targetItem.cartItemId &&
            item._signature !== targetItem._signature
          ) {
            return item;
          }
          const newQty = item.qty + delta;
          if (newQty <= 0) {
            return null;
          }
          return { ...item, qty: newQty };
        })
        .filter(Boolean);
    });
  };

  // Vaciar carrito
  const clearCart = () => {
    setCart([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  // Total en dólares
  const cartTotal = useMemo(() => {
    const rawTotal = cart.reduce(
      (total, item) => total + (Number(item.price) || 0) * (item.qty || 0),
      0
    );
    return Number(rawTotal.toFixed(2));
  }, [cart]);

  // Cantidad total de ítems (para mostrar en badges, etc.)
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + (item.qty || 0), 0),
    [cart]
  );

  return {
    cart,
    cartTotal,
    totalItems,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
  };
}
