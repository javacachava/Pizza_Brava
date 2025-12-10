import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Order, OrderStatus } from '../models/Order';
import { KitchenService } from '../services/domain/KitchenService';
import { useAuth } from './AuthContext'; // <--- 1. Importamos Auth

interface KitchenContextType {
    orders: Order[];
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    isConnected: boolean;
}

const KitchenContext = createContext<KitchenContextType | undefined>(undefined);
const kitchenService = new KitchenService();

export const KitchenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading: authLoading } = useAuth(); // <--- 2. Obtenemos el estado de autenticación
    const [orders, setOrders] = useState<Order[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const prevOrdersLength = useRef(0);

    useEffect(() => {
        audioRef.current = new Audio('/cocina.mp3');
    }, []);

    useEffect(() => {
        // <--- 3. REGLA DE SEGURIDAD:
        // Si está cargando el auth o no hay usuario, NO iniciar el listener de Firestore.
        if (authLoading || !user) {
            setOrders([]); // Limpiamos órdenes por seguridad
            setIsConnected(false);
            return;
        }

        // Si llegamos aquí, tenemos usuario. Iniciamos la suscripción.
        const unsubscribe = kitchenService.subscribeToOrders((updatedOrders) => {
            setOrders(updatedOrders);
            setIsConnected(true);
            const currentPending = updatedOrders.filter(o => o.status === 'pending').length;
            
            if (currentPending > 0 && updatedOrders.length > prevOrdersLength.current) {
                playAlertSound();
            }
            prevOrdersLength.current = updatedOrders.length;
        });

        return () => {
            unsubscribe();
            setIsConnected(false);
        };
    }, [user, authLoading]); // <--- 4. Se re-ejecuta solo cuando cambia el estado del usuario

    const playAlertSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play blocked (needs interaction)", e));
        }
    };

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        // Seguridad extra
        if (!user) return;
        await kitchenService.updateStatus(orderId, status);
    };

    return (
        <KitchenContext.Provider value={{ orders, updateOrderStatus, isConnected }}>
            {children}
        </KitchenContext.Provider>
    );
};

export const useKitchen = () => {
    const context = useContext(KitchenContext);
    if (!context) throw new Error("useKitchen must be used within KitchenProvider");
    return context;
};