import React, { useState, useMemo, useEffect } from "react";
import { X, CheckSquare, Square, ChefHat } from "lucide-react";
import { PIZZA_INGREDIENTS, PIZZA_RULES } from "../constants/productConfig";

export default function ProductOptionsModal({
  isOpen,
  product,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !product) return null;

  // Detectar si es Clásica (requiere tamaño)
  const isClassic = product.pizzaType === "Clasica";

  // Estado Tamaño (Solo para clásicas, defecto Personal)
  const [size, setSize] = useState("Personal");
  
  // Estado Ingredientes
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // Reiniciar estados al abrir producto nuevo
  useEffect(() => {
    setSize("Personal");
    setSelectedIngredients([]);
  }, [product]);

  // --- CALCULO DE PRECIO BASE SEGUN TAMAÑO ---
  // Busca en el objeto 'prices' del producto, o usa lógica fallback
  const currentBasePrice = useMemo(() => {
    if (!isClassic) return product.price; // Especialidades precio fijo

    if (product.prices && product.prices[size]) {
      return product.prices[size];
    }
    // Fallback si no configuraste precios en DB:
    // Personal = precio base, Grande = precio base + $5 (ejemplo)
    return size === "Grande" ? product.price + 5 : product.price;
  }, [product, size, isClassic]);

  // --- MANEJO DE INGREDIENTES ---
  const toggleIngredient = (ing) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ing)) return prev.filter((i) => i !== ing);
      return [...prev, ing];
    });
  };

  const { included, extraPrice } = PIZZA_RULES;
  
  const extraCount = Math.max(0, selectedIngredients.length - included);
  const finalPrice = currentBasePrice + (extraCount * extraPrice);

  const handleConfirm = () => {
    // Validación: Clásicas requieren 2 ingredientes
    if (isClassic && selectedIngredients.length < included) {
      alert(`Por favor elige al menos ${included} ingredientes para tu pizza clásica.`);
      return;
    }

    onConfirm({
      ...product,
      name: isClassic ? `${product.name} (${size})` : product.name, // Modificar nombre para el ticket
      price: finalPrice,
      selectedSize: isClassic ? size : "Único",
      ingredients: selectedIngredients,
      isConfigured: true, // Bandera para el sistema
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ChefHat size={18} className="text-amber-400"/> 
              Configurar Pizza
            </h3>
            <p className="text-xs text-slate-300">{product.name}</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 bg-slate-50 flex-1 overflow-y-auto space-y-6">
          
          {/* 1. SELECTOR DE TAMAÑO (Solo Clásicas) */}
          {isClassic && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                1. Elige Tamaño
              </h4>
              <div className="flex gap-3">
                {["Personal", "Grande"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                      size === s
                        ? "bg-amber-500 border-amber-600 text-white shadow-md scale-105"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. INGREDIENTES */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                {isClassic ? "2. Ingredientes" : "Personalizar (Opcional)"}
              </h4>
              <span className="text-xs text-slate-500">
                {selectedIngredients.length} seleccionados
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-2">
              {isClassic 
                ? `Incluye ${included} ingredientes. Extras +$${extraPrice.toFixed(2)}`
                : `Ingredientes extra tienen costo adicional.`}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {PIZZA_INGREDIENTS.map((ing) => {
                const isSelected = selectedIngredients.includes(ing);
                return (
                  <button
                    key={ing}
                    onClick={() => toggleIngredient(ing)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg border text-left transition-colors ${
                      isSelected
                        ? "bg-green-50 border-green-500 text-green-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    <span>{ing}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Precios */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Total a cobrar</p>
            <p className="text-2xl font-bold text-slate-900">
              ${finalPrice.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}