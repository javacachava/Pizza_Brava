import React from 'react';
import type { OrderItem } from '../../../../models/OrderItem';

interface Props {
    item: OrderItem;
    index: number;
    onRemove: (index: number) => void;
}

export const CartItem: React.FC<Props> = ({ item, index, onRemove }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600' }}>{item.quantity}x {item.productName}</span>
                    <span>${item.totalPrice.toFixed(2)}</span>
                </div>
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#718096', paddingLeft: '10px' }}>
                        {item.selectedOptions.map((opt, i) => (
                            <span key={i} style={{ display: 'block' }}>+ {opt.name}</span>
                        ))}
                    </div>
                )}
                {item.comment && (
                    <div style={{ fontSize: '0.8rem', color: '#e53e3e', fontStyle: 'italic' }}>
                        Nota: {item.comment}
                    </div>
                )}
            </div>
            <button 
                onClick={() => onRemove(index)}
                style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', marginLeft: '10px', padding: '0 5px' }}
            >
                &times;
            </button>
        </div>
    );
};