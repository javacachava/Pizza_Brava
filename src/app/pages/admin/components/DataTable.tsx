import React from 'react';
import { Button } from '../../../components/ui/Button';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    width?: string;
}

interface Props<T> {
    data: T[];
    columns: Column<T>[];
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onToggleActive?: (item: T) => void;
}

export function DataTable<T extends { id: string, isActive?: boolean }>({ data, columns, onEdit, onToggleActive }: Props<T>) {
    return (
        <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #edf2f7' }}>
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} style={{ padding: '12px 15px', textAlign: 'left', color: '#4a5568' }}>{col.header}</th>
                        ))}
                        <th style={{ padding: '12px 15px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                            {columns.map((col, i) => (
                                <td key={i} style={{ padding: '12px 15px' }}>
                                    {typeof col.accessor === 'function' 
                                        ? col.accessor(item) 
                                        : (item[col.accessor] as any)}
                                </td>
                            ))}
                            <td style={{ padding: '12px 15px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                {onToggleActive && (
                                    <button 
                                        onClick={() => onToggleActive(item)}
                                        style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '4px', 
                                            border: 'none', 
                                            backgroundColor: item.isActive ? '#c6f6d5' : '#fed7d7',
                                            color: item.isActive ? '#22543d' : '#822727',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        {item.isActive ? 'Activo' : 'Inactivo'}
                                    </button>
                                )}
                                {onEdit && <Button variant="outline" style={{ padding: '5px 10px' }} onClick={() => onEdit(item)}>✏️</Button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}