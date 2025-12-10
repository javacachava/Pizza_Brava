import React, { useEffect, useRef, useState } from 'react';
import type { Order } from '../../../models/Order';
import { useKitchen } from '../../../hooks/useKitchen';
import { KitchenColumn } from './components/KitchenColumn';
import { KioskControls } from './components/KioskControls';

export const KitchenPage: React.FC = () => {
    const { orders, refreshQueue, updateOrderStatus } = useKitchen();
    const [prevPending, setPrevPending] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('/cocina.mp3');
    }, []);

    useEffect(() => {
        const pending = orders.filter(o => o.status === 'pending').length;
        if (pending > prevPending) {
            audioRef.current?.play().catch(() => {});
        }
        setPrevPending(pending);
    }, [orders]);

    const advanceStatus = async (id: string, status: Order['status']) => {
        const next =
            status === 'pending' ? 'preparing' :
            status === 'preparing' ? 'ready' :
            status === 'ready' ? 'delivered' :
            null;

        if (next) await updateOrderStatus(id, next);
    };

    const pending = orders.filter(o => o.status === 'pending');
    const preparing = orders.filter(o => o.status === 'preparing');
    const ready = orders.filter(o => o.status === 'ready');

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{
                padding: '10px 20px',
                backgroundColor: '#2d3748',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <h1 style={{ margin: 0 }}>👨‍🍳 Cocina</h1>
                <div>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</div>
            </div>

            <div style={{ flex: 1, display: 'flex', padding: 10, background: '#1a202c' }}>
                <KitchenColumn
                    title="Nuevas"
                    color="#c53030"
                    orders={pending}
                    onAdvance={advanceStatus}
                />

                <KitchenColumn
                    title="Preparación"
                    color="#dd6b20"
                    orders={preparing}
                    onAdvance={advanceStatus}
                />

                <KitchenColumn
                    title="Listas"
                    color="#2f855a"
                    orders={ready}
                    onAdvance={advanceStatus}
                />
            </div>

            <KioskControls/>

            <button
                onClick={refreshQueue}
                style={{
                    position: 'fixed',
                    bottom: 10,
                    left: 10,
                    borderRadius: '50%',
                    width: 45,
                    height: 45,
                    backgroundColor: '#4a5568',
                    color: 'white',
                    border: 'none',
                    opacity: 0.6
                }}
            >
                ↻
            </button>
        </div>
    );
};
