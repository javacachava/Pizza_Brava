// src/components/modals/PizzaBuilderModal.jsx
import React, { useMemo, useState } from "react";
import { X, Check } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PizzaBuilderModal({
  product,
  globalConfig,
  ingredients = [],
  onClose,
  onConfirm,
}) {
  if (!product) return null;

  // =========================
  // 1. REGLAS / CONFIGURACIÓN
  // =========================

  // Intentamos ser tolerantes con distintos esquemas de config
  const rules =
    globalConfig?.global_rules?.classic_pizza ||
    globalConfig?.rules ||
    globalConfig?.prices ||
    {};

  // Número de ingredientes incluidos en el precio base
  const INCLUDED_COUNT =
    rules.includedIngredients ??
    rules.classic_pizza_included_ingredients ??
    rules.classicIncludedCount ??
    2;

  // Precio de cada ingrediente extra
  const EXTRA_ING_PRICE =
    rules.extraIngredientPrice ??
    rules.ingredient_extra_price ??
    rules.ingredientPrice ??
    rules.extraIngredient ??
    0.75;

  // Config de tamaños
  const sizeRules =
    rules.sizes ||
    globalConfig?.rules?.sizes || {
      Personal: { label: "Personal", priceModifier: 0 },
      Grande: { label: "Gigante", priceModifier: 5 },
    };

  const [size, setSize] = useState("Personal");
  const [selectedIngs, setSelectedIngs] = useState([]);

  // =========================
  // 2. HELPERS
  // =========================

  const basePrice = useMemo(() => {
    const base = Number(product.price || 0);
    const mod = sizeRules?.[size]?.priceModifier ?? 0;
    return Number((base + mod).toFixed(2));
  }, [product.price, size, sizeRules]);

  const extrasCost = useMemo(() => {
    if (!selectedIngs.length) return 0;

    // Primeros N incluidos, el resto cobra
    const free = INCLUDED_COUNT;
    if (selectedIngs.length <= free) return 0;

    const extras = selectedIngs.slice(free);

    // Si el ingrediente tiene price propio, se usa; si no, precio global
    const totalExtra = extras.reduce((sum, ing) => {
      const ingPrice =
        ing.price != null && !Number.isNaN(Number(ing.price))
          ? Number(ing.price)
          : EXTRA_ING_PRICE;
      return sum + ingPrice;
    }, 0);

    return Number(totalExtra.toFixed(2));
  }, [selectedIngs, INCLUDED_COUNT, EXTRA_ING_PRICE]);

  const total = useMemo(
    () => Number((basePrice + extrasCost).toFixed(2)),
    [basePrice, extrasCost]
  );

  const toggleIngredient = (ing) => {
    const already = selectedIngs.find((i) => i.id === ing.id);
    if (already) {
      setSelectedIngs((prev) => prev.filter((i) => i.id !== ing.id));
    } else {
      setSelectedIngs((prev) => [...prev, ing]);
    }
  };

  const handleConfirm = () => {
    if (selectedIngs.length < INCLUDED_COUNT) {
      toast.error(
        `Debes elegir al menos ${INCLUDED_COUNT} ingrediente${
          INCLUDED_COUNT === 1 ? "" : "s"
        }.`
      );
      return;
    }

    const nameWithSize = `${product.name} (${size})`;

    const details = [
      `Tamaño: ${size}`,
      selectedIngs.length
        ? `Ingredientes: ${selectedIngs.map((i) => i.name).join(", ")}`
        : "Sin ingredientes",
    ];

    if (selectedIngs.length > INCLUDED_COUNT) {
      details.push(
        `+${selectedIngs.length - INCLUDED_COUNT} ingrediente(s) extra`
      );
    }

    const cartItem = {
      id: product.id,
      cartItemId: `${product.id}_${size}_${Date.now()}`,
      name: nameWithSize,
      price: total, // precio unitario final (incluye extras)
      qty: 1,
      mainCategory: product.mainCategory || "Pizzas",
      details,
      // Por si luego quieres usar inventario:
      components: {
        size,
        ingredients: selectedIngs.map((i) => ({
          id: i.id,
          name: i.name,
        })),
      },
    };

    onConfirm(cartItem);
  };

  // =========================
  // 3. RENDER
  // =========================

  const activeIngredients = ingredients.filter(
    (ing) => ing.active !== false && (ing.stock ?? 1) > 0
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 text-slate-100 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400/80">
              CONFIGURAR PIZZA CLÁSICA
            </p>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              {product.name}
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                {product.mainCategory || "Pizzas"}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-700/70 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex flex-col md:flex-row gap-6 p-6 md:p-7">
          {/* Columna izquierda: tamaño y resumen */}
          <div className="w-full md:w-64 shrink-0 space-y-6">
            {/* Tamaño */}
            <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                Tamaño
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(sizeRules).map((sz) => {
                  const def = sizeRules[sz] || {};
                  const isActive = size === sz;
                  const label = def.label || sz;
                  const mod = def.priceModifier || 0;
                  const displayPrice = Number(
                    (Number(product.price || 0) + mod).toFixed(2)
                  );

                  return (
                    <button
                      key={sz}
                      onClick={() => setSize(sz)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                        isActive
                          ? "border-orange-500 bg-orange-500/15 text-orange-100 shadow-lg shadow-orange-900/40"
                          : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-orange-500/60 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span>{label}</span>
                        {isActive && (
                          <Check size={14} className="text-orange-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        ${displayPrice.toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumen / reglas */}
            <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-4 space-y-2 text-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Reglas de ingredientes
              </p>
              <p className="text-slate-200">
                Incluye{" "}
                <span className="font-bold text-orange-300">
                  {INCLUDED_COUNT}
                </span>{" "}
                ingrediente{INCLUDED_COUNT === 1 ? "" : "s"}.
              </p>
              <p className="text-slate-300">
                Ingredientes extra:
                <span className="font-bold text-orange-300">
                  {" "}
                  ${EXTRA_ING_PRICE.toFixed(2)}
                </span>{" "}
                c/u.
              </p>
              <p className="text-xs text-slate-500">
                Los ingredientes sin stock o desactivados no se pueden elegir.
              </p>
            </div>

            {/* Resumen selección */}
            <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-4 space-y-2 text-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Selección actual
              </p>
              <p className="text-slate-200">
                {selectedIngs.length} ingrediente
                {selectedIngs.length === 1 ? "" : "s"} seleccionado
                {selectedIngs.length ? ":" : "."}
              </p>
              {selectedIngs.length > 0 && (
                <ul className="mt-1 space-y-1 text-xs text-slate-300">
                  {selectedIngs.map((i) => (
                    <li key={i.id} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-orange-400" />
                      {i.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Columna derecha: lista de ingredientes */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
              Ingredientes disponibles
            </p>
            {activeIngredients.length === 0 ? (
              <div className="border border-dashed border-slate-700 rounded-2xl p-6 text-center text-sm text-slate-400">
                No hay ingredientes disponibles configurados en el sistema.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1">
                {activeIngredients.map((ing) => {
                  const isSelected = !!selectedIngs.find(
                    (i) => i.id === ing.id
                  );
                  const isDisabled =
                    ing.active === false || (ing.stock ?? 0) <= 0;

                  const ingPrice =
                    ing.price != null && !Number.isNaN(Number(ing.price))
                      ? Number(ing.price)
                      : EXTRA_ING_PRICE;

                  return (
                    <button
                      key={ing.id}
                      type="button"
                      onClick={() => !isDisabled && toggleIngredient(ing)}
                      disabled={isDisabled}
                      className={`relative group p-3 rounded-xl border text-left text-xs md:text-sm transition-all ${
                        isSelected
                          ? "border-orange-500 bg-orange-500/15 text-orange-50 shadow-md shadow-orange-900/40"
                          : "border-slate-700 bg-slate-900/80 text-slate-200 hover:border-orange-500/50 hover:bg-slate-800"
                      } ${isDisabled ? "opacity-40 grayscale cursor-not-allowed" : ""}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <p className="font-semibold truncate">
                            {ing.name || "Ingrediente"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Extra: ${ingPrice.toFixed(2)}
                          </p>
                          {typeof ing.stock === "number" && (
                            <p className="text-[10px] text-slate-500">
                              Stock: {ing.stock}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Total pizza
            </p>
            <p className="text-2xl font-black text-orange-300">
              ${total.toFixed(2)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-lg shadow-orange-900/40 hover:from-orange-500 hover:to-red-400 active:scale-95 transition-transform"
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
