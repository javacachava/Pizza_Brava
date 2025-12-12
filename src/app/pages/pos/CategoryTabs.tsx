import React from 'react';
import type { Category } from '../../../models/Category';

interface Props {
  categories: Category[];
  active: string | null;
  onChange: (id: string) => void;
}

export const CategoryTabs: React.FC<Props> = ({
  categories,
  active,
  onChange
}) => {
  return (
    <div className="flex gap-3 overflow-x-auto py-3 pb-4 no-scrollbar">
      {/* Renderizado exclusivo de categorías activas en BD */}
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`
            px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 shadow-sm
            ${active === cat.id 
              ? 'bg-orange-600 text-white shadow-orange-200 scale-105 ring-2 ring-orange-100' 
              : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-500'
            }
          `}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};