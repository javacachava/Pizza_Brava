import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function HamburgerModal({ product, potatoes, sauces, onClose, onConfirm }) {
  const [selectedPotato, setSelectedPotato] = useState(potatoes[0]); // Default
  const [selectedSauces, setSelectedSauces] = useState([]);

  // Lógica: Si la hamburguesa NO incluye papas, cobrar precio full.
  // Si SI incluye, cobrar diferencia si hay un tipo "premium" (opcional).
  
  const handleConfirm = () => {
    let price = product.price;
    let details = [];

    if (product.includesFries && selectedPotato) {
       details.push(`Papas: ${selectedPotato.name}`);
       // Si las papas seleccionadas tienen sobreprecio sobre las standard
       if (selectedPotato.extraPrice) price += selectedPotato.extraPrice;
    }

    // Cobrar salsas extra
    selectedSauces.forEach(s => {
        price += s.price;
        details.push(`Salsa: ${s.name}`);
    });

    onConfirm({ ...product, finalPrice: price, details });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{product.name}</h2>
            
            {product.includesFries && (
                <div className="mb-4">
                    <h3 className="font-bold text-sm mb-2">Tipo de Papas</h3>
                    <div className="flex flex-wrap gap-2">
                        {potatoes.map(p => (
                            <button key={p.id} onClick={()=>setSelectedPotato(p)}
                                className={`px-3 py-2 rounded border text-sm ${selectedPotato?.id===p.id ? 'bg-orange-100 border-orange-500' : ''}`}>
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h3 className="font-bold text-sm mb-2">Salsas Extra (+$0.50 c/u)</h3>
                <div className="grid grid-cols-2 gap-2">
                    {sauces.map(s => {
                        const active = selectedSauces.find(x => x.id === s.id);
                        return (
                            <button key={s.id} onClick={() => {
                                active ? setSelectedSauces(prev => prev.filter(x => x.id!==s.id)) : setSelectedSauces(prev=>[...prev, s])
                            }} className={`px-3 py-2 rounded border text-sm flex justify-between ${active ? 'bg-green-100 border-green-500' : ''}`}>
                                {s.name} {active && <Check size={14}/>}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-slate-500">Cancelar</button>
                <button onClick={handleConfirm} className="bg-slate-900 text-white px-6 py-2 rounded-lg">Agregar</button>
            </div>
        </div>
    </div>
  );
}