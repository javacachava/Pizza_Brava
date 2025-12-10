import React, { createContext, useContext, useState } from 'react';
import type { OrderItem } from '../models/OrderItem';
import { POSService } from '../services/domain/POSService';
import { useAuth } from './AuthContext';

interface POSContextType {
    cart: OrderItem[];
    addToCart: (item: OrderItem) => void;
    removeFromCart: (index: number) => void;
    updateQuantity: (index: number, delta: number) => void;
    clearCart: () => void;
    placeOrder: (customerName: string, type: 'dine-in' | 'takeaway' | 'delivery', extraData?: any) => Promise<string>;
    total: number;
    isProcessing: boolean;
}

const POSContext = createContext<POSContextType | undefined>(undefined);
const posService = new POSService();

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Cálculo seguro de totales
    const total = cart.reduce((acc, item) => acc + item.totalPrice, 0);

    const addToCart = (newItem: OrderItem) => {
        setCart(prev => [...prev, newItem]);
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const newQty = Math.max(1, item.quantity + delta);
            return {
                ...item,
                quantity: newQty,
                totalPrice: (item.unitPrice * newQty)
            };
        }));
    };

    const clearCart = () => setCart([]);

    const placeOrder = async (customerName: string, type: 'dine-in' | 'takeaway' | 'delivery', extraData?: any) => {
        if (!user) throw new Error("Sesión expirada");
        setIsProcessing(true);
        try {
            const id = await posService.createOrder(cart, customerName, type, user.id, extraData?.tableNumber);
            clearCart();
            return id;
        } catch (e) {
            throw e;
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <POSContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, placeOrder, total, isProcessing }}>
            {children}
        </POSContext.Provider>
    );
};

// Exportación nombrada explícita para evitar errores de vite
export const usePOSContext = () => {
    const context = useContext(POSContext);
    if (!context) throw new Error("usePOSContext must be used within POSProvider");
    return context;
};