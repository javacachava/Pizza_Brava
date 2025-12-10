import React from 'react';
import type { MenuItem } from '../../../../models/MenuItem';

interface Props {
    product: MenuItem;
    onClick: () => void;
}

export const ProductCard: React.FC<Props> = ({ product, onClick }) => {
    return (
        <div 
            onClick={onClick}
            style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: '15px', 
                cursor: 'pointer',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '140px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
        >
            <div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{product.name}</h4>
                {product.description && <p style={{ fontSize: '0.8rem', color: '#718096', margin: 0 }}>{product.description.slice(0, 40)}...</p>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#2d3748' }}>${product.price.toFixed(2)}</span>
                <span style={{ fontSize: '1.2rem', color: '#ff6b00' }}>+</span>
            </div>
        </div>
    );
};