    import React from 'react';
import type { ComboOption, ComboSlot } from '../../../models/ProductTypes';

interface Props {
  slots: ComboSlot[];
  selections: Record<string, ComboOption>;
  onSelect: (id: string, opt: ComboOption) => void;
}

export const ComboSelector: React.FC<Props> = ({ slots, selections, onSelect }) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {slots.map((slot) => (
        <div key={slot.id}>
          <h4 className="text-white text-lg font-bold mb-3">{slot.title}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {slot.options.map((option) => {
              const isSelected = selections[slot.id]?.id === option.id;
              // Buscamos la opción por defecto para calcular diferencias de precio
              const defaultOpt = slot.options.find((o) => o.id === slot.defaultOptionId) || slot.options[0];
              const diff = Math.max(0, option.price - defaultOpt.price);

              return (
                <button
                  key={option.id}
                  onClick={() => slot.isSwappable && onSelect(slot.id, option)}
                  disabled={!slot.isSwappable}
                  className={`
                    relative p-3 rounded-xl border-2 text-left transition-all flex flex-col items-center justify-center gap-2 h-32
                    ${isSelected 
                      ? 'border-[#FF5722] bg-[#2A2A2A]' 
                      : 'border-transparent bg-[#1E1E1E]'}
                    ${!slot.isSwappable ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600'}
                  `}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl overflow-hidden">
                     {option.image ? (
                       <img src={option.image} alt={option.name} className="w-full h-full object-cover"/>
                     ) : (
                       <span>🍔</span>
                     )}
                  </div>
                  
                  <span className="text-white font-medium text-sm text-center leading-tight line-clamp-2">
                    {option.name}
                  </span>

                  {diff > 0 && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-[#FF5722] bg-[#FF5722]/10 px-1.5 py-0.5 rounded-md">
                      +${diff.toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};