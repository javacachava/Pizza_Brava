import React, { useState, useEffect, useMemo } from "react";
import { X, CheckSquare, Square, ChefHat } from "lucide-react";
import { PIZZA_INGREDIENTS, PIZZA_RULES } from "../constants/productConfig";

export default function ProductOptionsModal({
  isOpen,
  product,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !product) return null;

  const [size, setSize] = useState("Personal");
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  useEffect(() => {
    setSize("Personal");
    setSelectedIngredients([]);
  }, [product]);

  // Calcular precio base según tamaño
  const basePrice = useMemo(() => {
    return product.price + PIZZA_RULES.sizes[size].priceModifier;
  }, [product, size]);

  // Calcular precio extras
  const extraCount = Math.max(0, selectedIngredients.length - PIZZA_RULES.includedIngredients);
  const extrasCost = extraCount * PIZZA_RULES.extraIngredientPrice;
  const finalPrice = basePrice + extrasCost;

  const toggleIngredient = (ing) => {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const handleConfirm = () => {
    // Validación Estricta para Pizza Clásica
    if (selectedIngredients.length < PIZZA_RULES.includedIngredients) {
        alert(`Debes elegir al menos ${PIZZA_RULES.includedIngredients} ingredientes.`);
        return;
    }

    const cartItem = {
      ...product,
      cartItemId: `${product.id}-${Date.now()}`,
      price: finalPrice,
      ingredients: selectedIngredients,
      selectedSize: size,
      name: `${product.name} (${size})`, // Nombre formateado para ticket
      isConfigured: true
    };

    onConfirm(cartItem);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-amber-900 text-white p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ChefHat size={18} className="text-amber-400"/> 
              Armar Pizza Clásica
            </h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 bg-slate-50 flex-1 overflow-y-auto space-y-6">
          
          {/* 1. Selector de Tamaño */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              1. Tamaño
            </h4>
            <div className="flex gap-3">
              {Object.keys(PIZZA_RULES.sizes).map((key) => {
                  const info = PIZZA_RULES.sizes[key];
                  return (
                      <button
                          key={key}
                          onClick={() => setSize(key)}
                          className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                          size === key
                              ? "bg-amber-600 border-amber-700 text-white shadow-md scale-105"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                          {info.label}
                      </button>
                  );
              })}
            </div>
          </div>

          {/* 2. Ingredientes */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                2. Elige Ingredientes
              </h4>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                  selectedIngredients.length < PIZZA_RULES.includedIngredients 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-green-100 text-green-600'
              }`}>
                {selectedIngredients.length} / {PIZZA_RULES.includedIngredients} Mínimo
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-2">
              Incluye {PIZZA_RULES.includedIngredients} ingredientes. Adicionales +${PIZZA_RULES.extraIngredientPrice.toFixed(2)}
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
                        ? "bg-green-50 border-green-500 text-green-800 ring-1 ring-green-500"
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

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Precio Final</p>
            <p className="text-2xl font-bold text-slate-900">
              ${finalPrice.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-500 font-medium hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleConfirm} className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg">
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}