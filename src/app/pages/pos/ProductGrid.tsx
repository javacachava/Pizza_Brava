import React from 'react';
import type { MenuItem } from '../../../models/MenuItem';
import type { ComboDefinition } from '../../../models/ComboDefinition';
import { ProductCard } from './ProductCard';

interface Props {
  products: MenuItem[];
  combos: ComboDefinition[];
  onProductClick: (product: MenuItem) => void;
  onComboClick: (combo: ComboDefinition) => void;
}

export const ProductGrid: React.FC<Props> = ({ 
  products, 
  combos, 
  onProductClick, 
  onComboClick 
}) => {
  return (
    <div className="pb-20 space-y-8">
      
      {/* SECCIÓN COMBOS */}
      {combos.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-4 px-1 flex items-center gap-2">
            🔥 Ofertas y Combos
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{combos.length}</span>
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {combos.map(combo => (
              <ProductCard
                key={`combo-${combo.id}`}
                product={{
                  id: combo.id,
                  name: combo.name,
                  description: combo.description,
                  price: combo.price,
                  categoryId: 'combos',
                  isAvailable: combo.isAvailable,
                  usesIngredients: false,
                  usesFlavors: false,
                  usesSizeVariant: false,
                  comboEligible: false
                } as MenuItem}
                onClick={() => onComboClick(combo)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN PRODUCTOS */}
      {products.length > 0 && (
        <div>
          {combos.length > 0 && <hr className="border-gray-200 my-6" />} {/* Separador si hay ambos */}
          
          <h3 className="text-lg font-bold text-gray-700 mb-4 px-1 flex items-center gap-2">
            🍕 Menú Individual
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{products.length}</span>
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {products.map(p => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onClick={() => onProductClick(p)} 
              />
            ))}
          </div>
        </div>
      )}

      {products.length === 0 && combos.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p>No se encontraron productos.</p>
        </div>
      )}
    </div>
  );
};