import React from 'react';
import type { MenuItem } from '../../../models/MenuItem';
import { formatPrice } from '../../../utils/format';

interface Props {
  product: MenuItem;
  onClick: () => void;
}

export const ProductCard: React.FC<Props> = ({ product, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 flex flex-col items-start text-left h-full"
    >
      <div className="w-full flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800 text-sm leading-tight group-hover:text-orange-600 transition-colors">
          {product.name}
        </h3>
      </div>

      <p className="text-xs text-gray-400 mb-4 line-clamp-2 flex-1">
        {product.description || 'Sin descripción'}
      </p>

      <div className="w-full flex justify-between items-center pt-2 border-t border-gray-50">
        <span className="font-bold text-lg text-gray-900">
          {formatPrice(product.price)}
        </span>
        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </div>
      </div>
    </button>
  );
};