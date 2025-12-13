import React from 'react';
import type { ProductUI, ComboOption, ComboSlot, VariantGroup, VariantOption, Ingredient } from '../../../models/ProductTypes';
import { useProductSelection } from '../../../hooks/useProductSelection';

// --- COMPONENTES INTERNOS (Para evitar errores de importación) ---

const ComboSelector = ({ slots, selections, onSelect }: { slots: ComboSlot[], selections: Record<string, ComboOption>, onSelect: (id: string, opt: ComboOption) => void }) => (
  <div className="flex flex-col gap-6 w-full">
    {slots.map((slot) => (
      <div key={slot.id}>
        <h4 className="text-white text-lg font-bold mb-3">{slot.title}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {slot.options.map((option) => {
            const isSelected = selections[slot.id]?.id === option.id;
            const defaultOpt = slot.options.find((o) => o.id === slot.defaultOptionId) || slot.options[0];
            const diff = Math.max(0, option.price - defaultOpt.price);
            return (
              <button
                key={option.id}
                onClick={() => slot.isSwappable && onSelect(slot.id, option)}
                disabled={!slot.isSwappable}
                className={`relative p-3 rounded-xl border-2 text-left transition-all flex flex-col items-center justify-center gap-2 h-32 ${isSelected ? 'border-[#FF5722] bg-[#2A2A2A]' : 'border-transparent bg-[#1E1E1E]'} ${!slot.isSwappable ? 'opacity-50' : ''}`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl">
                   {option.image ? <img src={option.image} className="w-full h-full rounded-full object-cover"/> : '🍔'}
                </div>
                <span className="text-white font-medium text-sm text-center">{option.name}</span>
                {diff > 0 && <span className="absolute top-2 right-2 text-xs font-bold text-[#FF5722] bg-[#FF5722]/10 px-1 rounded">+${diff.toFixed(2)}</span>}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

const VariantSelector = ({ groups, selections, onSelect }: { groups: VariantGroup[], selections: Record<string, VariantOption>, onSelect: (id: string, opt: VariantOption) => void }) => (
  <div className="flex flex-col gap-4 w-full">
    {groups.map((group) => (
      <div key={group.id}>
        <h4 className="text-gray-300 text-sm font-bold uppercase mb-2">{group.name}</h4>
        <div className="flex flex-wrap gap-2">
          {group.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(group.id, option)}
              className={`px-4 py-2 rounded-full font-bold text-sm ${selections[group.id]?.id === option.id ? 'bg-[#FF5722] text-white' : 'bg-[#1E1E1E] text-gray-400'}`}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const IngredientSelector = ({ ingredients, selectedIds, onToggle }: { ingredients: Ingredient[], selectedIds: Set<string>, onToggle: (id: string) => void }) => (
  <div className="w-full">
    <h4 className="text-white text-lg font-bold mb-4">Ingredientes</h4>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {ingredients.map((ing) => {
        const isSelected = selectedIds.has(ing.id);
        return (
          <button
            key={ing.id}
            onClick={() => onToggle(ing.id)}
            className={`flex items-center justify-between p-3 rounded-lg border ${isSelected ? 'bg-[#2A2A2A] border-[#FF5722] text-white' : 'bg-[#1E1E1E] border-transparent text-gray-400'}`}
          >
            <span>{ing.name}</span>
            {!ing.isDefault && <span className="text-xs text-[#FF5722] font-bold">+${ing.price}</span>}
          </button>
        );
      })}
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: ProductUI | null;
  onAddToCart: (item: any) => void;
}

export const ProductSelectionModal: React.FC<Props> = ({ isOpen, onClose, product, onAddToCart }) => {
  if (!isOpen || !product) return null;

  const { totalPrice, comboSelections, variantSelections, selectedIngredients, selectComboOption, selectVariant, toggleIngredient } = useProductSelection(product);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#121212] w-full max-w-4xl h-[85vh] rounded-2xl flex overflow-hidden border border-[#333]">
        {/* Columna Izquierda (Foto) */}
        <div className="w-1/3 bg-[#1E1E1E] hidden md:flex flex-col relative">
           <div className="h-64 bg-gray-800 flex items-center justify-center text-6xl">
             {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover"/> : '🍕'}
           </div>
           <div className="p-6">
             <h2 className="text-2xl font-bold text-white">{product.name}</h2>
             <p className="text-gray-400 mt-2">{product.description}</p>
             <div className="mt-auto pt-6 text-4xl font-bold text-[#FF5722]">${totalPrice.toFixed(2)}</div>
           </div>
        </div>

        {/* Columna Derecha (Opciones) */}
        <div className="flex-1 flex flex-col h-full">
          <div className="flex justify-between p-4 border-b border-[#333]">
             <h3 className="md:hidden text-white font-bold">{product.name}</h3>
             <button onClick={onClose} className="text-white bg-[#333] rounded-full w-8 h-8 ml-auto">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {product.behavior === 'COMBO_PACK' && product.comboConfig && (
              <ComboSelector slots={product.comboConfig.slots} selections={comboSelections} onSelect={selectComboOption} />
            )}
            {product.behavior === 'SIMPLE_VARIANT' && product.variantConfig && (
              <VariantSelector groups={product.variantConfig.groups} selections={variantSelections} onSelect={selectVariant} />
            )}
            {product.behavior === 'CUSTOM_BUILDER' && product.builderConfig && (
              <IngredientSelector ingredients={product.builderConfig.ingredients} selectedIds={selectedIngredients} onToggle={toggleIngredient} />
            )}
          </div>

          <div className="p-4 border-t border-[#333]">
            <button 
              onClick={() => {
                onAddToCart({ product, finalPrice: totalPrice, modifiers: { combo: comboSelections, variants: variantSelections, ingredients: Array.from(selectedIngredients) } });
                onClose();
              }}
              className="w-full py-4 bg-[#FF5722] text-white font-bold text-xl rounded-xl hover:bg-[#E64A19] flex justify-between px-6"
            >
              <span>Agregar</span>
              <span>${totalPrice.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};