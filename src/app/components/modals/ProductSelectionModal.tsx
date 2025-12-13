import React from 'react';
import type { ProductUI } from '../../../models/ProductTypes';
import { useProductSelection } from '../../../hooks/useProductSelection';

// Importamos los componentes modulares
import { ComboSelector } from '../modals/ComboSelector';
import { VariantSelector } from './ProductSelection/VariantSelector';
import { IngredientSelector } from './ProductSelection/IngredientSelector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: ProductUI | null;
  onAddToCart: (item: any) => void;
}

export const ProductSelectionModal: React.FC<Props> = ({ isOpen, onClose, product, onAddToCart }) => {
  // Si no está abierto o no hay producto, no renderizamos nada
  if (!isOpen || !product) return null;

  // Hook de lógica de negocio
  const { 
    totalPrice, 
    comboSelections, 
    variantSelections, 
    selectedIngredients, 
    selectComboOption, 
    selectVariant, 
    toggleIngredient 
  } = useProductSelection(product);

  const handleAddToCart = () => {
    onAddToCart({ 
      product, 
      finalPrice: totalPrice, 
      modifiers: { 
        combo: comboSelections, 
        variants: variantSelections, 
        ingredients: Array.from(selectedIngredients) 
      } 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#121212] w-full max-w-4xl h-[85vh] rounded-2xl flex overflow-hidden border border-[#333] shadow-2xl shadow-black/50">
        
        {/* Columna Izquierda (Foto y Resumen) - Visible solo en Desktop */}
        <div className="w-1/3 bg-[#1E1E1E] hidden md:flex flex-col relative border-r border-[#333]">
           <div className="h-64 bg-gray-800 flex items-center justify-center text-8xl relative overflow-hidden group">
             {product.imageUrl ? (
               <img src={product.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={product.name}/>
             ) : (
               <span className="select-none">🍕</span>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] via-transparent to-transparent opacity-80"/>
           </div>
           
           <div className="p-8 flex-1 flex flex-col">
             <h2 className="text-3xl font-bold text-white leading-tight mb-2">{product.name}</h2>
             <p className="text-gray-400 text-sm leading-relaxed mb-6">
               {product.description || "Personaliza este producto a tu gusto con las opciones disponibles."}
             </p>
             
             <div className="mt-auto pt-6 border-t border-[#333]">
               <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">Precio Total</span>
               <div className="text-5xl font-bold text-[#FF5722] mt-1">${totalPrice.toFixed(2)}</div>
             </div>
           </div>
        </div>

        {/* Columna Derecha (Opciones y Acción) */}
        <div className="flex-1 flex flex-col h-full bg-[#121212]">
          
          {/* Header Móvil / Botón Cerrar */}
          <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] sticky top-0 bg-[#121212] z-10">
             <div className="md:hidden">
                <h3 className="text-white font-bold text-lg">{product.name}</h3>
                <span className="text-[#FF5722] font-bold">${totalPrice.toFixed(2)}</span>
             </div>
             <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-white hover:bg-[#333] rounded-full p-2 transition-all ml-auto"
                aria-label="Cerrar"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
          
          {/* Contenido Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
            <div className="space-y-8 pb-20">
              
              {/* Selector de Combos */}
              {product.behavior === 'COMBO_PACK' && product.comboConfig && (
                <section className="animate-slideUp">
                  <ComboSelector 
                    slots={product.comboConfig.slots} 
                    selections={comboSelections} 
                    onSelect={selectComboOption} 
                  />
                </section>
              )}

              {/* Selector de Variantes (Tamaños/Sabores) */}
              {product.behavior === 'SIMPLE_VARIANT' && product.variantConfig && (
                <section className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                  <VariantSelector 
                    groups={product.variantConfig.groups} 
                    selections={variantSelections} 
                    onSelect={selectVariant} 
                  />
                </section>
              )}

              {/* Selector de Ingredientes (Builder) */}
              {product.behavior === 'CUSTOM_BUILDER' && product.builderConfig && (
                <section className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
                  <IngredientSelector 
                    ingredients={product.builderConfig.ingredients} 
                    selectedIds={selectedIngredients} 
                    onToggle={toggleIngredient} 
                  />
                </section>
              )}
            </div>
          </div>

          {/* Footer de Acción */}
          <div className="p-4 border-t border-[#2A2A2A] bg-[#161616]">
            <button 
              onClick={handleAddToCart}
              className="w-full py-4 bg-[#FF5722] text-white font-bold text-xl rounded-xl hover:bg-[#E64A19] active:scale-[0.98] transition-all flex justify-between items-center px-6 shadow-lg shadow-[#FF5722]/20"
            >
              <span>Agregar a la Orden</span>
              <span className="bg-black/20 px-3 py-1 rounded-lg">${totalPrice.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};