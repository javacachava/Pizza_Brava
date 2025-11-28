import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PizzaBuilderModal({ product, globalConfig, ingredients, onClose, onConfirm }) {
  // Regla: N Ingredientes
  const INCLUDED_COUNT = globalConfig?.rules?.classic_pizza_included_ingredients || 2;
  const EXTRA_PRICE = globalConfig?.rules?.ingredient_extra_price || 0.75;

  const [selectedIngs, setSelectedIngs] = useState([]);
  const [size, setSize] = useState("Personal");

  const toggleIng = (ing) => {
    if (selectedIngs.find(i => i.id === ing.id)) {
      setSelectedIngs(prev => prev.filter(i => i.id !== ing.id));
    } else {
      setSelectedIngs(prev => [...prev, ing]);
    }
  };

  const calculateTotal = () => {
    const sizePrice = product.sizes?.[size] || product.price; // Asumiendo estructura de precio por tamaño
    const extraCount = Math.max(0, selectedIngs.length - INCLUDED_COUNT);
    const extraCost = extraCount * EXTRA_PRICE;
    return sizePrice + extraCost;
  };

  const handleConfirm = () => {
    if (selectedIngs.length < INCLUDED_COUNT) {
      return toast.error(`Selecciona al menos ${INCLUDED_COUNT} ingredientes.`);
    }
    
    const extraCount = Math.max(0, selectedIngs.length - INCLUDED_COUNT);
    
    onConfirm({
      ...product,
      finalPrice: calculateTotal(),
      details: [`Tamaño: ${size}`, ...selectedIngs.map(i => i.name)],
      configuration: {
        size,
        ingredients: selectedIngs,
        extraCost: extraCount * EXTRA_PRICE
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 bg-slate-900 text-white flex justify-between">
          <h2 className="font-bold text-xl">Armar {product.name}</h2>
          <button onClick={onClose}><X /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Selector Tamaño */}
          <div className="flex gap-4">
            {['Personal', 'Grande'].map(s => (
              <button key={s} onClick={() => setSize(s)} 
                className={`flex-1 py-4 rounded-xl font-bold border-2 ${size === s ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-500'}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Grid Ingredientes */}
          <div>
            <div className="flex justify-between mb-2">
              <h3 className="font-bold text-slate-700">Ingredientes ({selectedIngs.length}/{INCLUDED_COUNT} Incluidos)</h3>
              {selectedIngs.length > INCLUDED_COUNT && <span className="text-orange-600 font-bold text-xs">Extras: +${((selectedIngs.length - INCLUDED_COUNT) * EXTRA_PRICE).toFixed(2)}</span>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ingredients.map(ing => {
                const isSelected = selectedIngs.find(i => i.id === ing.id);
                return (
                  <button key={ing.id} onClick={() => toggleIng(ing)}
                    disabled={!ing.active || ing.stock <= 0}
                    className={`p-3 rounded-lg border text-left text-sm flex items-center gap-2 transition-all ${isSelected ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-200 hover:border-orange-300'} ${(!ing.active || ing.stock<=0) && 'opacity-50 grayscale'}`}>
                    {isSelected && <Check size={14}/>} {ing.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
          <div className="text-2xl font-black text-slate-900">${calculateTotal().toFixed(2)}</div>
          <button onClick={handleConfirm} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800">Agregar</button>
        </div>
      </div>
    </div>
  );
}