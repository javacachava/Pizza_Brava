import React from 'react';
import type { VariantGroup, VariantOption } from '../../../../models/ProductTypes';

interface Props {
  groups: VariantGroup[];
  selections: Record<string, VariantOption>;
  onSelect: (id: string, opt: VariantOption) => void;
}

export const VariantSelector: React.FC<Props> = ({ groups, selections, onSelect }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {groups.map((group) => (
        <div key={group.id}>
          <h4 className="text-gray-300 text-sm font-bold uppercase mb-2 tracking-wider">
            {group.name}
          </h4>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const isSelected = selections[group.id]?.id === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => onSelect(group.id, option)}
                  className={`
                    px-4 py-2 rounded-full font-bold text-sm transition-all duration-200
                    ${isSelected 
                      ? 'bg-[#FF5722] text-white shadow-lg shadow-orange-900/20 transform scale-105' 
                      : 'bg-[#1E1E1E] text-gray-400 hover:bg-[#252525] hover:text-gray-200'}
                  `}
                >
                  {option.name}
                  {option.priceModifier ? ` (+$${option.priceModifier})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};