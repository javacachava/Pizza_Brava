import React from 'react';
import type { Order } from '../../../../models/Order';
import type { OrderItem } from '../../../../models/OrderItem';
import { Button } from '../../../components/ui/Button';

interface Props {
    order: Order;
    onAdvance: (orderId: string, currentStatus: string) => void;
}

export const KitchenOrderCard: React.FC<Props> = ({ order, onAdvance }) => {
    
    const getOrderTypeLabel = (type: string) => {
        switch(type) {
            case 'dine-in': return '🍽️ MESA';
            case 'takeaway': return '👜 LLEVAR';
            case 'delivery': return '🛵 DOMICILIO'; 
            default: return type;
        }
    };

    const getNextActionLabel = (status: string) => {
        switch(status) {
            case 'pending': return '👨‍🍳 Empezar';
            case 'preparing': return '✅ Terminar';
            case 'ready': return '📦 Despachar';
            default: return null;
        }
    };

    // Validación de fecha segura
    const getMinutesAgo = () => {
        try {
            const created = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            return Math.floor((new Date().getTime() - created.getTime()) / 60000);
        } catch (e) {
            return 0;
        }
    };
    
    const minutesAgo = getMinutesAgo();

    return (
        <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
            marginBottom: '15px', 
            borderLeft: `6px solid ${order.status === 'pending' ? '#e53e3e' : order.status === 'preparing' ? '#dd6b20' : '#38a169'}`,
            overflow: 'hidden'
        }}>
            {/* Header: ID y Tiempo */}
            <div style={{ padding: '10px', backgroundColor: '#f7fafc', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    {/* Usamos orderNumber si existe (nuevo sistema), fallback a ID corto */}
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        #{order.orderNumber ? order.orderNumber.split('-')[1] : order.id?.slice(-4).toUpperCase()}
                    </span>
                    <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#718096' }}>{minutesAgo} min</span>
                </div>
                <div style={{ fontWeight: 'bold', color: '#2d3748' }}>
                    {getOrderTypeLabel(order.type)}
                    {order.tableNumber && <span style={{ marginLeft: '5px' }}>#{order.tableNumber}</span>}
                </div>
            </div>
            
            {/* Nombre Cliente - IMPORTANTE: NO MOSTRAR TELÉFONO NI DIRECCIÓN AQUÍ */}
            <div style={{ padding: '5px 10px', backgroundColor: '#fffaf0', borderBottom: '1px solid #edf2f7', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Cliente: {order.customerName || 'Cliente'}
            </div>

            {/* Lista de Items */}
            <div style={{ padding: '10px' }}>
                {order.items.map((item: OrderItem, index: number) => (
                    <div key={index} style={{ marginBottom: '8px', borderBottom: index < order.items.length - 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 'bold', marginRight: '8px', fontSize: '1.1rem' }}>{item.quantity}x</span>
                            <div>
                                <span style={{ fontSize: '1.1rem' }}>{item.productName}</span>
                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                    <div style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '2px' }}>
                                        {item.selectedOptions.map((opt: { name: string }, i: number) => (
                                            <span key={i} style={{ display: 'block' }}>• {opt.name}</span>
                                        ))}
                                    </div>
                                )}
                                {item.comment && (
                                    <div style={{ backgroundColor: '#fff5f5', color: '#c53030', padding: '4px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        ⚠️ {item.comment}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Acciones */}
            <div style={{ padding: '10px', borderTop: '1px solid #edf2f7' }}>
                <Button 
                    variant={order.status === 'pending' ? 'danger' : order.status === 'preparing' ? 'primary' : 'secondary'}
                    style={{ width: '100%', height: '50px', fontSize: '1.2rem' }}
                    onClick={() => order.id && onAdvance(order.id, order.status)}
                >
                    {getNextActionLabel(order.status)}
                </Button>
            </div>
        </div>
    );
};