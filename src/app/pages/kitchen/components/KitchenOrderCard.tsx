import React from 'react';
import type { Order } from '../../../../models/Order';
import type { OrderItem } from '../../../../models/OrderItem';
import { Button } from '../../../components/ui/Button';

interface Props {
    order: Order;
    onAdvance: (orderId: string, currentStatus: Order['status']) => void;
}

export const KitchenOrderCard: React.FC<Props> = ({ order, onAdvance }) => {
    
    const getOrderTypeLabel = (type: Order['type']) => {
        switch(type) {
            case 'dine-in': return '🍽️ MESA';
            case 'takeaway': return '👜 LLEVAR';
            case 'delivery': return '🛵 DOMICILIO';
            default: return type;
        }
    };

    const getNextActionLabel = (status: Order['status']) => {
        switch(status) {
            case 'pending': return '👨‍🍳 Empezar';
            case 'preparing': return '✅ Terminar';
            case 'ready': return '📦 Despachar';
            default: return null;
        }
    };

    const created =
        order.createdAt instanceof Date
            ? order.createdAt
            : new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt);

    const minutesAgo = Math.floor((Date.now() - created.getTime()) / 60000);

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '15px',
            borderLeft: `6px solid ${
                order.status === 'pending' ? '#e53e3e' :
                order.status === 'preparing' ? '#dd6b20' :
                '#38a169'
            }`,
            overflow: 'hidden'
        }}>
            
            <div style={{
                padding: '10px',
                backgroundColor: '#f7fafc',
                borderBottom: '1px solid #edf2f7',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        #{order.id?.slice(-4).toUpperCase()}
                    </span>
                    <span style={{ marginLeft: 10, color: '#718096' }}>{minutesAgo} min</span>
                </div>

                <div style={{ fontWeight: 'bold' }}>
                    {getOrderTypeLabel(order.type)}
                    {order.tableNumber && <span> #{order.tableNumber}</span>}
                </div>
            </div>

            <div style={{
                padding: '5px 10px',
                backgroundColor: '#fffaf0',
                borderBottom: '1px solid #edf2f7',
                fontWeight: 'bold'
            }}>
                Cliente: {order.customerName || 'Anónimo'}
            </div>

            <div style={{ padding: '10px' }}>
                {order.items.map((item: OrderItem, i: number) => (
                    <div key={i} style={{
                        marginBottom: 8,
                        borderBottom: i < order.items.length - 1 ? '1px dashed #e2e8f0' : 'none',
                        paddingBottom: 5
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 'bold', marginRight: 8 }}>{item.quantity}x</span>
                            <div>
                                <span style={{ fontSize: '1.05rem' }}>{item.productName}</span>

                                {Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0 && (
                                    <div style={{ fontSize: '0.85rem', marginTop: 2 }}>
                                        {item.selectedOptions.map((opt: any, j: number) => (
                                            <span key={j}>• {opt.name}</span>
                                        ))}
                                    </div>
                                )}

                                {item.comment && (
                                    <div style={{
                                        backgroundColor: '#fff5f5',
                                        color: '#c53030',
                                        padding: 4,
                                        borderRadius: 4,
                                        marginTop: 4,
                                        fontWeight: 'bold'
                                    }}>
                                        ⚠️ {item.comment}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ padding: 10, borderTop: '1px solid #edf2f7' }}>
                <Button
                    variant={
                        order.status === 'pending' ? 'danger' :
                        order.status === 'preparing' ? 'primary' :
                        'secondary'
                    }
                    style={{ width: '100%', height: 50 }}
                    onClick={() => order.id && onAdvance(order.id, order.status)}
                >
                    {getNextActionLabel(order.status)}
                </Button>
            </div>
        </div>
    );
};
