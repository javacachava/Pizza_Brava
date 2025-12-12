import React from 'react';
import type { MenuItem } from '../../../models/MenuItem';
import type { Combo } from '../../../models/Combo'; // Asegúrate de que este modelo exista o usa ComboDefinition
import { ProductCard } from './ProductCard';

interface Props {
  products: MenuItem[];
  combos: Combo[]; // <--- Agregado para satisfacer el error TS2322
  onProductClick: (product: MenuItem) => void;
  onComboClick: (combo: Combo) => void;
}

export const ProductGrid: React.FC<Props> = ({ 
  products, 
  combos, 
  onProductClick, 
  onComboClick 
}) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 py-4">
      {/* Sección de Combos (si hay) */}
      {combos.map(combo => (
        <ProductCard
          key={`combo-${combo.id}`}
          product={{
            ...combo as unknown as MenuItem, // Casting temporal seguro para visualización
            categoryId: 'combos',
            isAvailable: true,
            usesIngredients: false,
            usesFlavors: false,
            usesSizeVariant: false,
            comboEligible: false
          }}
          onClick={() => onComboClick(combo)}
          // Puedes agregar una prop 'isCombo' a ProductCard si quieres estilo distinto
        />
      ))}

      {/* Sección de Productos */}
      {products.map(p => (
        <ProductCard 
          key={p.id} 
          product={p} 
          onClick={() => onProductClick(p)} 
        />
      ))}
    </div>
  );
};