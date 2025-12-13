import React from 'react';
import type { MenuItem } from '../../../models/MenuItem';
import type { ComboDefinition } from '../../../models/ComboDefinition';
import { CategoryThemeFactory } from '../../../utils/CategoryThemeFactory';

interface Props {
  item: MenuItem | ComboDefinition;
  type: 'PRODUCT' | 'COMBO';
  onClick: () => void;
}

export const ProductCard: React.FC<Props> = ({ item, type, onClick }) => {
  const isCombo = type === 'COMBO';
  
  // Obtenemos el tema dinámico
  const categoryKey = isCombo ? 'combos' : (item as MenuItem).categoryId || 'all';
  const theme = CategoryThemeFactory.getTheme(String(categoryKey));

  return (
    <button 
      onClick={onClick}
      className={`
        group relative w-full h-36 md:h-40 flex flex-col text-left
        /* FONDO: Usamos un gris muy oscuro pero con un toque de transparencia para el efecto glass */
        bg-[#1E1E1E]/95 backdrop-blur-sm
        rounded-2xl border border-[#333] overflow-hidden
        transition-all duration-500 ease-out
        /* HOVER: Elevación, borde de color y sombra coloreada sutil (Glow) */
        hover:-translate-y-1 hover:border-[color:var(--accent)] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]
        active:scale-[0.97] active:translate-y-0
      `}
      // Variables CSS locales para usar el color del tema en los efectos
      style={{ 
        '--accent': isCombo ? '#FF5722' : theme.accentColor.replace('text-', ''), // Hack simple para extraer color o usar el naranja por defecto
        '--shadow-color': theme.shadowColor 
      } as React.CSSProperties}
    >
      
      {/* 1. EFECTO DESTELLO (SHINE) al Hover */}
      <div className="absolute inset-0 z-20 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-0 group-hover:animate-shine" />
      </div>

      {/* 2. CAPA DE CONTENIDO (Texto y Precio) */}
      <div className="relative z-10 p-4 flex flex-col justify-between h-full w-full">
        
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-gray-100 font-bold text-sm md:text-base leading-tight line-clamp-2 pr-4 group-hover:text-white transition-colors drop-shadow-md">
            {item.name}
          </h3>
          {isCombo && (
            <span className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-lg tracking-wider transform group-hover:scale-110 transition-transform">
              COMBO
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-2">
          <div className="flex flex-col">
             <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-gray-400 transition-colors">Precio</span>
             {/* Precio con un efecto de "Resplandor" sutil en el texto */}
             <span className={`text-xl md:text-2xl font-black tracking-tight ${theme.accentColor} drop-shadow-lg`}>
               ${item.price.toFixed(2)}
             </span>
          </div>

          {/* Botón "+" que cambia de color y rota */}
          <div className={`
            w-9 h-9 rounded-full bg-[#252525] border border-[#333] flex items-center justify-center 
            text-gray-400 shadow-lg
            group-hover:bg-white group-hover:text-black group-hover:border-white group-hover:rotate-90
            transition-all duration-300
          `}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. ICONO DE FONDO (Marca de Agua Animada) */}
      <div className={`
        absolute -bottom-4 -right-4 
        text-8xl md:text-[7rem] 
        opacity-[0.08] group-hover:opacity-[0.15] 
        /* ANIMACIÓN 3D: Rota y escala al hacer hover */
        transform -rotate-12 scale-100 group-hover:scale-125 group-hover:-rotate-6 group-hover:translate-x-2 group-hover:translate-y-2
        transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
        pointer-events-none z-0 filter blur-[1px] group-hover:blur-0
      `}>
         {/* Aplicamos el gradiente al icono mismo */}
         <span className={`bg-gradient-to-br ${theme.gradient} bg-clip-text text-transparent`}>
            {theme.icon}
         </span>
      </div>
      
      {/* Gradiente sutil inferior para mejorar lectura del precio */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-0" />
    </button>
  );
};