import React from 'react';
import type { Category } from '../../../../models/Category';

interface Props {
    categories: Category[];
    selectedId: string;
    onSelect: (id: string) => void;
}

export const CategoryTabs: React.FC<Props> = ({ categories, selectedId, onSelect }) => {
    return (
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px 0', borderBottom: '1px solid #eee' }}>
            <button 
                onClick={() => onSelect('ALL')}
                style={{ 
                    padding: '8px 16px', 
                    borderRadius: '20px', 
                    border: 'none',
                    backgroundColor: selectedId === 'ALL' ? '#ff6b00' : '#edf2f7',
                    color: selectedId === 'ALL' ? 'white' : '#2d3748',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                }}
            >
                Todo
            </button>
            {categories.map(cat => (
                <button 
                    key={cat.id} 
                    onClick={() => onSelect(cat.id)}
                    style={{ 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        border: 'none',
                        backgroundColor: selectedId === cat.id ? '#ff6b00' : '#edf2f7',
                        color: selectedId === cat.id ? 'white' : '#2d3748',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
};