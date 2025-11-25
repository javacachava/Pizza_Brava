// src/components/ProductOptionsModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import { PIZZA_DEFAULT_CONFIG, buildPizzaCartItem } from "../constants/productConfig";

export default function ProductOptionsModal({
  isOpen,
  onClose,
  baseProduct,
  onConfirm
}) {
  if (!isOpen || !baseProduct) return null;

  const [size, setSize] = useState(PIZZA_DEFAULT_CONFIG.sizes[0]);
  const [family, setFamily] = useState(PIZZA_DEFAULT_CONFIG.families[0]);

  const currentPrice =
    PIZZA_DEFAULT_CONFIG.prices?.[size]?.[family] ??
    baseProduct.price ??
    0;

  const handleConfirm = () => {
    const item = buildPizzaCartItem(baseProduct, size, family);
    onConfirm(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-3">
          <h3 className="font-bold text-lg">
            Configurar Pizza
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">
              Producto base
            </p>
            <p className="font-bold text-slate-900">
              {baseProduct.name}
            </p>
          </div>

          {/* Tamaño */}
          <div>
            <p className="text-sm font-semibold mb-2">
              Tamaño
            </p>
            <div className="flex gap-2">
              {PIZZA_DEFAULT_CONFIG.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                    size === s
                      ? "bg-amber-100 border-amber-500 text-amber-800"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div>
            <p className="text-sm font-semibold mb-2">
              Tipo
            </p>
            <div className="flex gap-2">
              {PIZZA_DEFAULT_CONFIG.families.map((f) => (
                <button
                  key={f}
                  onClick={() => setFamily(f)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                    family === f
                      ? "bg-amber-100 border-amber-500 text-amber-800"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Precio */}
          <div className="flex justify-between items-center border-t pt-3 mt-2">
            <span className="text-sm font-semibold text-slate-600">
              Precio calculado
            </span>
            <span className="text-xl font-bold text-slate-900">
              ${currentPrice.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-lg shadow-lg hover:from-red-500 hover:to-red-600 active:scale-95 transition"
          >
            Agregar al pedido
          </button>
        </div>
      </div>
    </div>
  );
}
