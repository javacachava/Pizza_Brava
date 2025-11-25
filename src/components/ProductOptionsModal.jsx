import React, { useState, useMemo } from 'react';
import { X, Plus, Check } from 'lucide-react';

export default function ProductOptionsModal({ product, config, isOpen, onClose, onConfirm }) {
  const [selectedToppings, setSelectedToppings] = useState([]);

  if (!isOpen || !product) return null;

  const toggleTopping = (topping) => {
    setSelectedToppings(prev => 
      prev.includes(topping) 
        ? prev.filter(t => t !== topping)
        : [...prev, topping]
    );
  };

  // Cálculo de precio dinámico
  const extraCount = Math.max(0, selectedToppings.length - config.maxFreeToppings);
  const extraCost = extraCount * config.extraToppingPrice;
  const finalPrice = product.price + extraCost;

  const handleConfirm = () => {
    // Construir nombre compuesto
    const toppingsStr = selectedToppings.length > 0 ? ` (${selectedToppings.join(', ')})` : '';
    const finalName = `${product.name}${toppingsStr}`;

    onConfirm({
      ...product,
      name: finalName,
      price: finalPrice,
      originalPrice: product.price,
      selectedToppings: selectedToppings
    });
    setSelectedToppings([]); // Reset
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-amber-900 text-white p-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg">Personalizar Producto</h3>
            <p className="text-amber-200 text-sm">{product.name}</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
            <p className="font-bold">Reglas:</p>
            <ul className="list-disc list-inside">
              <li>Ingredientes incluidos: <strong>{config.maxFreeToppings}</strong></li>
              <li>Ingredientes extra: <strong>${config.extraToppingPrice.toFixed(2)}</strong> c/u</li>
            </ul>
          </div>

          <h4 className="font-bold text-slate-700 mb-3">Elige los ingredientes:</h4>
          <div className="grid grid-cols-2 gap-2">
            {config.toppings.map(topping => {
              const isSelected = selectedToppings.includes(topping);
              return (
                <button
                  key={topping}
                  onClick={() => toggleTopping(topping)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    isSelected 
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-sm' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-amber-600 border-amber-600' : 'border-slate-400'}`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  {topping}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center mb-4 text-sm">
            <span className="text-slate-500">Extras ({extraCount}):</span>
            <span className="font-bold text-slate-700">+${extraCost.toFixed(2)}</span>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Agregar por ${finalPrice.toFixed(2)}
          </button>
        </div>

      </div>
    </div>
  );
}