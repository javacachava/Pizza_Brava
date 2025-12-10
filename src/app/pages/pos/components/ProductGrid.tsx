import React from 'react';
import type { MenuItem } from '../../../../models/MenuItem';
import { ProductCard } from './ProductCard';

interface Props {
    products: MenuItem[];
    onProductClick: (product: MenuItem) => void;
}

export const ProductGrid: React.FC<Props> = ({ products, onProductClick }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px', padding: '15px 0' }}>
            {products.map(p => (
                <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />
            ))}
        </div>
    );
};