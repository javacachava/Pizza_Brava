import React from 'react';
import type { Order } from '../../../../models/Order';
import { KitchenOrderCard } from './KitchenOrderCard';

interface Props {
    title: string;
    orders: Order[];
    color: string;
    onAdvance: (orderId: string, currentStatus: Order['status']) => void;
}

export const KitchenColumn: React.FC<Props> = ({ title, orders, color, onAdvance }) => {
    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#edf2f7',
            margin: '0 5px',
            borderRadius: 8,
            overflow: 'hidden'
        }}>

            <div style={{
                padding: '15px',
                backgroundColor: color,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <span>{title}</span>
                <span style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                }}>
                    {orders.length}
                </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#a0aec0', marginTop: 50 }}>
                        Sin órdenes
                    </div>
                ) : (
                    orders.map(o => (
                        <KitchenOrderCard key={o.id} order={o} onAdvance={onAdvance}/>
                    ))
                )}
            </div>
        </div>
    );
};
