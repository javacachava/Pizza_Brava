import React from 'react';
import { useComboLogic } from '../../hooks/useComboLogic';
import { X, ChevronRight, AlertCircle } from 'lucide-react';

// Subcomponente para seleccionar opción de un slot
const SlotSelector = ({ slot, availableOptions, onSelect, currentSelection }) => {
  return (
    <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
      <h4 className="font-bold text-slate-700 mb-2 uppercase text-xs tracking-wider">{slot.label}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {availableOptions.map(opt => {
          // Lógica de visualización de precio extra
          // Si el precio del item > precio incluido en el slot, mostramos la diferencia
          const extra = Math.max(0, (opt.price || 0) - (slot.includedPrice || 0));
          const isSelected = currentSelection?.product?.id === opt.id;

          return (
            <button key={opt.id} onClick={() => onSelect({ product: opt })}
              className={`p-3 rounded-lg border text-left text-sm flex justify-between items-center transition-all ${isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white hover:border-blue-300'}`}>
              <span className="font-medium text-slate-700">{opt.name}</span>
              {extra > 0 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">+${extra.toFixed(2)}</span>}
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default function ComboBuilderModal({ comboProduct, sides, drinks, onClose, onConfirm }) {
  // comboProduct trae la definición de 'slots' desde Firestore
  const { handleSelectSlot, calculation } = useComboLogic(comboProduct, { sides, drinks });

  const handleFinish = () => {
    if (!calculation.isValid) return;
    onConfirm({
      ...comboProduct,
      finalPrice: calculation.finalPrice,
      details: Object.values(calculation.selections).map(s => s.product.name), // Simplificado
      comboSelections: calculation.selections, // Datos crudos para inventario
      breakdown: calculation.breakdown
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">{comboProduct.name}</h2>
            <p className="text-slate-400 text-sm">Configuración del Combo</p>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-lg hover:bg-white/20"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {comboProduct.slots.map(slot => {
            // Filtrar opciones según la configuración del slot
            let options = [];
            if (slot.type === 'side') {
              options = sides.filter(s => slot.allowedOptions.includes(s.id));
            } else if (slot.type === 'drink') {
              options = drinks; // O filtrar por tamaño si aplica
            } else if (slot.type === 'pizza_classic') {
               // Aquí deberías renderizar un mini-constructor de pizza o abrir otro modal
               // Por brevedad, asumimos que se selecciona una "configuración"
               return (
                 <div key={slot.id} className="mb-4 p-4 border rounded bg-yellow-50">
                    <p className="font-bold">Slot de Pizza: {slot.label}</p>
                    <button className="text-blue-600 underline" onClick={() => toast("Abrir sub-modal de pizza")}>Configurar Pizza</button>
                 </div>
               );
            }

            return (
              <SlotSelector 
                key={slot.id} 
                slot={slot} 
                availableOptions={options} 
                onSelect={(data) => handleSelectSlot(slot.id, data)}
                currentSelection={calculation.selections[slot.id]}
              />
            );
          })}
        </div>

        {/* Footer con desglose */}
        <div className="bg-slate-50 border-t p-6 flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Precio Base: ${calculation.basePrice.toFixed(2)}</div>
            {calculation.breakdown.map((item, i) => (
                <div key={i} className="text-xs text-orange-600 font-bold">+ ${item.price.toFixed(2)} ({item.name})</div>
            ))}
            <div className="text-3xl font-black text-slate-900">${calculation.finalPrice.toFixed(2)}</div>
          </div>
          
          <button 
            onClick={handleFinish}
            disabled={!calculation.isValid}
            className={`px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all ${calculation.isValid ? 'bg-green-600 text-white hover:bg-green-500 shadow-lg hover:scale-105' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
          >
            {calculation.isValid ? <>Confirmar Combo <ChevronRight /></> : <><AlertCircle size={18}/> Completa las opciones</>}
          </button>
        </div>
      </div>
    </div>
  );
}