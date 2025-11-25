import React, { useState, useMemo } from "react";
import { X, CheckSquare, Square } from "lucide-react";
import { PIZZA_INGREDIENTS, PIZZA_RULES } from "../constants/productConfig";

export default function ProductOptionsModal({
  isOpen,
  product,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !product) return null;

  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const toggleIngredient = (ing) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ing)) {
        return prev.filter((i) => i !== ing);
      }
      return [...prev, ing];
    });
  };

  const { included, extraPrice } = PIZZA_RULES;

  const extraCount = useMemo(() => {
    return Math.max(0, selectedIngredients.length - included);
  }, [selectedIngredients, included]);

  const finalPrice = useMemo(() => {
    return product.price + extraCount * extraPrice;
  }, [product.price, extraCount, extraPrice]);

  const handleConfirm = () => {
    if (selectedIngredients.length < included) {
      alert(`Debes elegir al menos ${included} ingredientes.`);
      return;
    }

    onConfirm({
      ...product,
      // Guardamos información útil para cocina/boleta
      ingredients: selectedIngredients,
      basePrice: product.price,
      extraIngredients: extraCount,
      price: finalPrice,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">Configurar Pizza</h3>
            <p className="text-xs text-slate-300">
              {product.name} – ${product.price.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/10 p-1 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 bg-slate-50 flex-1 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600">
            Elige <strong>{included}</strong> ingredientes incluidos. Cualquier
            ingrediente adicional tendrá un costo extra de{" "}
            <strong>${extraPrice.toFixed(2)}</strong> c/u.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {PIZZA_INGREDIENTS.map((ing) => {
              const isSelected = selectedIngredients.includes(ing);
              return (
                <button
                  key={ing}
                  type="button"
                  onClick={() => toggleIngredient(ing)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border text-left ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare size={14} />
                  ) : (
                    <Square size={14} />
                  )}
                  <span className="truncate">{ing}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 text-xs text-slate-600 space-y-1">
            <p>
              Seleccionados:{" "}
              <strong>{selectedIngredients.length}</strong>
            </p>
            <p>
              Extras: <strong>{extraCount}</strong>{" "}
              {extraCount > 0 &&
                `(+$${(extraCount * extraPrice).toFixed(2)})`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="text-slate-500">Total</p>
            <p className="text-lg font-bold text-slate-900">
              ${finalPrice.toFixed(2)}
            </p>
          </div>

          <div className="flex gap-2 flex-1 justify-end">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
            >
              Agregar al pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
