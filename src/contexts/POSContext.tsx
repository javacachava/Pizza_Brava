import React, { createContext, useContext, useState } from 'react';
import type { OrderItem } from '../models/OrderItem';
import { POSService } from '../services/domain/POSService';

interface POSContextType {
    cart: OrderItem[];
    addToCart: (item: OrderItem) => void;
    removeFromCart: (index: number) => void;
    clearCart: () => void;
    placeOrder: (customerName: string, type: 'dine-in' | 'takeaway', userId: string) => Promise<void>;
    total: number;
}

const POSContext = createContext<POSContextType | undefined>(undefined);
const posService = new POSService();

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<OrderItem[]>([]);

    const addToCart = (item: OrderItem) => {
        setCart(prev => [...prev, item]);
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const clearCart = () => setCart([]);

    const total = cart.reduce((acc, item) => acc + item.totalPrice, 0);

    const placeOrder = async (customerName: string, type: 'dine-in' | 'takeaway', userId: string) => {
        await posService.createOrder(cart, customerName, type, userId);
        clearCart();
    };

    return (
        <POSContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, placeOrder, total }}>
            {children}
        </POSContext.Provider>
    );
};

export const usePOSContext = () => {
    const context = useContext(POSContext);
    if (!context) throw new Error("usePOSContext must be used within POSProvider");
    return context;
};