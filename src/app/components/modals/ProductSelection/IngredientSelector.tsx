import React from 'react';
import type { Ingredient } from '../../../../models/ProductTypes';

interface Props {
  ingredients: Ingredient[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

export const IngredientSelector: React.FC<Props> = ({ ingredients, selectedIds, onToggle }) => {
  return (
    <div className="w-full">
      <h4 className="text-white text-lg font-bold mb-4">Personaliza tus Ingredientes</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ingredients.map(ing => {
          const isSelected = selectedIds.has(ing.id);
          return (
            <button
              key={ing.id}
              onClick={() => onToggle(ing.id)}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-all
                ${isSelected 
                  ? 'bg-[#2A2A2A] border-[#FF5722] text-white' 
                  : 'bg-[#1E1E1E] border-transparent text-gray-400 hover:bg-[#252525]'}
              `}
            >
              <div className="flex items-center gap-2">
                {/* Checkbox visual */}
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[#FF5722] border-[#FF5722]' : 'border-gray-500'}`}>
                   {isSelected && <span className="text-white text-xs">✓</span>}
                </div>
                <span className="text-sm font-medium">{ing.name}</span>
              </div>
              
              {/* Precio Extra solo si no es default */}
              {!ing.isDefault && (
                <span className="text-xs text-[#FF5722] font-bold">+${ing.price.toFixed(2)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};