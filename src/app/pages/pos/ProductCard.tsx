import React from 'react';
import type { MenuItem } from '../../../models/MenuItem';
import type { ComboDefinition } from '../../../models/ComboDefinition';
import { CategoryThemeFactory } from '../../../utils/CategoryThemeFactory';
import { Plus } from 'lucide-react';

interface Props {
  item: MenuItem | ComboDefinition;
  type: 'PRODUCT' | 'COMBO';
  onClick: () => void;
}

export const ProductCard: React.FC<Props> = ({ item, type, onClick }) => {
  // Lógica Estricta para Visualización de Combo
  // Se considera combo SOLO si viene de la tabla de combos (type='COMBO') 
  // O si su categoría es explícitamente 'combos'.
  // IGNORAMOS comboEligible para la UI.
  const isCombo = type === 'COMBO' ;
  
  // Obtenemos el tema basado en categoría real
  const categoryKey = isCombo ? 'combos' : (item as MenuItem).categoryId || 'all';
  const theme = CategoryThemeFactory.getTheme(String(categoryKey));
  
  // Icono dinámico
  const IconComponent = theme.icon;

  return (
    <button 
      onClick={onClick}
      className={`
        group relative w-full h-40 md:h-44 flex flex-col justify-between
        bg-gradient-to-br from-[#1E1E1E] to-black
        rounded-2xl border border-white/10 
        p-5 overflow-hidden transition-all duration-300
        hover:border-opacity-50 hover:shadow-2xl hover:-translate-y-1
        active:scale-[0.98]
      `}
      style={{ borderColor: 'rgba(255,255,255,0.1)' }} 
    >
      {/* 1. ÍCONO DECORATIVO (Top Right) */}
      <IconComponent
        strokeWidth={1.5}
        className={`
          absolute top-4 right-4
          w-16 h-16
          opacity-20 group-hover:opacity-30 transition-opacity duration-500
          ${theme.textColor} 
        `}
      />

      {/* 2. CONTENIDO SUPERIOR */}
      <div className="z-10 w-full pr-12 text-left">
        <h3 className="text-white text-lg font-bold leading-tight line-clamp-2 group-hover:text-white/90">
          {item.name}
        </h3>
        
        {/* BADGE COMBO (Solo si es realmente un combo) */}
        {isCombo && (
          <span className="inline-block mt-1 text-[10px] font-bold tracking-wider text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded shadow-sm border border-orange-500/20">
            COMBO
          </span>
        )}
      </div>

      {/* 3. FOOTER (Precio y Botón) */}
      <div className="z-10 w-full">
        <p className="text-[10px] tracking-widest text-gray-500 font-bold mb-0.5 text-left uppercase">
          Precio
        </p>

        <div className="flex items-center justify-between">
          {/* Precio con color de categoría (ej. Azul para bebidas) */}
          <span className={`text-2xl font-bold tracking-tight ${theme.textColor}`}>
            ${item.price.toFixed(2)}
          </span>

          {/* Botón + (Siempre Naranja Sólido) */}
          <div className="
            w-10 h-10
            rounded-full
            bg-[#FF5722]
            text-white
            flex items-center justify-center
            shadow-lg shadow-orange-900/40
            group-hover:bg-[#FF7043] group-hover:scale-110 group-active:scale-90
            transition-all duration-300
          ">
            <Plus size={20} strokeWidth={3} />
          </div>
        </div>
      </div>
      
      {/* Efecto de Brillo Sutil */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
};