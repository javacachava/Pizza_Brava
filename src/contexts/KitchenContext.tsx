import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Order } from '../models/Order';
import { KitchenService } from '../services/domain/KitchenService';

interface KitchenContextType {
    orders: Order[];
    refreshQueue: () => Promise<void>;
    updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
}

const KitchenContext = createContext<KitchenContextType | undefined>(undefined);
const kitchenService = new KitchenService();

export const KitchenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [orders, setOrders] = useState<Order[]>([]);

    const refreshQueue = async () => {
        const queue = await kitchenService.getQueue();
        setOrders(queue);
    };

    const updateOrderStatus = async (orderId: string, status: Order['status']) => {
        await kitchenService.updateStatus(orderId, status);
        await refreshQueue();
    };

    useEffect(() => {
        refreshQueue();
        const interval = setInterval(refreshQueue, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <KitchenContext.Provider value={{ orders, refreshQueue, updateOrderStatus }}>
            {children}
        </KitchenContext.Provider>
    );
};

export const useKitchenContext = () => {
    const context = useContext(KitchenContext);
    if (!context) throw new Error("useKitchenContext must be used within KitchenProvider");
    return context;
};