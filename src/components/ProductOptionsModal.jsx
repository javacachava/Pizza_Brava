// src/components/ProductOptionsModal.jsx
import React, { useState, useMemo, useEffect } from "react";
import { X } from "lucide-react";

export default function ProductOptionsModal({
  isOpen,
  product,
  globalConfig,
  onClose,
  onConfirm
}) {
  const [sizeKey, setSizeKey] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  useEffect(() => {
    if (!product) return;
    const sizes = product.sizes ? Object.keys(product.sizes) : [];
    setSizeKey(sizes.length > 0 ? sizes[0] : null);
    setSelectedIngredients([]);
  }, [product]);

  if (!isOpen || !product) return null;

  const mainCategory = (product.mainCategory || "").toLowerCase();
  const isPizza = mainCategory === "pizzas";
  const isClassic =
    product.pizzaType === "Clasica" ||
    product.flags?.isClassic === true ||
    product.type === "pizza_classic";

  const isSpecialty =
    product.pizzaType === "Especialidad" ||
    product.flags?.isSpecialty === true ||
    product.type === "pizza_specialty";

  const sizes = product.sizes || null;
  const hasSizes = sizes && Object.keys(sizes).length > 0;

  // Resolución de configuración tolerante a versiones
  const rules = globalConfig?.rules || globalConfig?.global_rules || {};
  const includedCount = rules.classic_pizza_included_ingredients ?? 2;
  const extraPricePerIngredient = rules.ingredient_extra_price ?? 0.75;
  const allIngredients = globalConfig?.ingredients || [];

  const basePrice = useMemo(() => {
    if (isPizza && hasSizes && sizeKey && sizes[sizeKey]) {
      return Number(sizes[sizeKey].price || 0);
    }
    return Number(product.price ?? product.basePrice ?? 0);
  }, [isPizza, hasSizes, sizeKey, sizes, product.price, product.basePrice]);

  const extraCount = Math.max(0, selectedIngredients.length - includedCount);
  const extrasCost = extraCount * extraPricePerIngredient;

  const finalPrice = basePrice + (isClassic ? extrasCost : 0);

  const toggleIngredient = (name) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleConfirm = () => {
    if (isClassic) {
      if (selectedIngredients.length < includedCount) {
        toast.error(`Selecciona al menos ${includedCount} ingredientes`, {
          icon: <AlertCircle className="text-red-500" />,
        });
        return; // Bloquear confirmación
      }
    }

    const details = [];

    if (isPizza && hasSizes && sizeKey) {
      details.push(`Tamaño: ${sizeKey}`);
    }

    if (isClassic) {
      if (selectedIngredients.length > 0) {
        const ingText = selectedIngredients.join(", ");
        details.push(`Ingredientes: ${ingText}`);
      } else {
        // Esto teóricamente ya no se alcanza por la validación
        details.push(`Ingredientes: (sin seleccionar)`);
      }

      if (extraCount > 0 && extraPricePerIngredient > 0) {
        details.push(
          `Extras: ${extraCount} ingr. (+ $${(
            extraCount * extraPricePerIngredient
          ).toFixed(2)})`
        );
      }
    }

    const payload = {
      ...product,
      qty: 1,
      price: Number(finalPrice.toFixed(2)),
      finalPrice: Number(finalPrice.toFixed(2)),
      details
    };

    onConfirm(payload);
    onClose();
  };

  const title = (() => {
    if (isClassic) return "Configurar Pizza Clásica";
    if (isSpecialty) return "Configurar Pizza de Especialidad";
    if (isPizza) return "Configurar Pizza";
    return "Configurar Producto";
  })();

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-400">
              Personalizar
            </p>
            <h2 className="text-lg font-bold text-slate-50">{title}</h2>
            <p className="text-xs text-slate-400">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950">
          {/* Columna 1: tamaño */}
          <div className="md:col-span-1 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Tamaño
            </p>
            {isPizza && hasSizes ? (
              <div className="space-y-2">
                {Object.entries(sizes).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setSizeKey(key)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                      sizeKey === key
                        ? "bg-orange-500/10 border-orange-500 text-orange-300"
                        : "bg-slate-900 border-slate-700 text-slate-200 hover:border-orange-400"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{key}</span>
                      <span className="font-mono text-xs">
                        ${Number(info.price || 0).toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Este producto no tiene tamaños configurables.
              </p>
            )}

            <div className="mt-4 text-xs text-slate-500">
              <p>
                Precio base:{" "}
                <span className="font-semibold text-slate-200">
                  ${basePrice.toFixed(2)}
                </span>
              </p>
              {isClassic && (
                <p>
                  Ingredientes incluidos:{" "}
                  <span className="font-semibold text-slate-200">
                    {includedCount}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Columna 2 y 3: ingredientes */}
          <div className="md:col-span-2 space-y-4">
            {isClassic ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Ingredientes
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Seleccionados:{" "}
                    <span className="font-semibold text-slate-200">
                      {selectedIngredients.length}
                    </span>{" "}
                    / {includedCount} incluidos
                  </p>
                </div>

                {allIngredients && allIngredients.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                    {allIngredients.map((ingName) => {
                      const selected = selectedIngredients.includes(ingName);
                      return (
                        <button
                          key={ingName}
                          type="button"
                          onClick={() => toggleIngredient(ingName)}
                          className={`text-xs px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${
                            selected
                              ? "bg-orange-500/10 border-orange-500 text-orange-200"
                              : "bg-slate-900 border-slate-700 text-slate-200 hover:border-orange-400"
                          }`}
                        >
                          <span className="truncate">{ingName}</span>
                          {selected && (
                            <span className="ml-2 text-[10px] font-bold bg-orange-500/20 px-1.5 py-0.5 rounded">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No hay ingredientes configurados.
                  </p>
                )}

                <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex flex-col gap-1">
                  <p>
                    Extras:{" "}
                    <span className="font-semibold text-slate-200">
                      {extraCount}
                    </span>{" "}
                    x ${extraPricePerIngredient.toFixed(2)} ={" "}
                    <span className="font-semibold text-slate-200">
                      ${extrasCost.toFixed(2)}
                    </span>
                  </p>
                  <p>
                    Total calculado:{" "}
                    <span className="font-semibold text-orange-300">
                      ${finalPrice.toFixed(2)}
                    </span>
                  </p>
                </div>
              </>
            ) : isSpecialty ? (
              <p className="text-xs text-slate-400">
                Esta es una pizza de especialidad. No admite ingredientes personalizados por este medio.
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Este producto no requiere configuración adicional.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="text-sm text-slate-300">
            <span className="text-xs uppercase text-slate-500 mr-2">
              Total:
            </span>
            <span className="text-lg font-black text-orange-400">
              ${finalPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 border border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-900/30"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}