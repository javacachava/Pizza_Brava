import { useEffect, useState } from 'react';
import { OrdersRepository } from '../repos/OrdersRepository';
import type { Order } from '../models/Order';

export const useKitchen = () => {
    const repo = new OrdersRepository();
    const [orders, setOrders] = useState<Order[]>([]);

    const refreshQueue = async () => {
        const all = await repo.getAll();
        setOrders(all.filter(o => o.status !== 'delivered'));
    };

    const updateOrderStatus = async (id: string, status: Order['status']) => {
        await repo.update(id, { status });
        await refreshQueue();
    };

    useEffect(() => {
        refreshQueue();
    }, []);

    return { orders, refreshQueue, updateOrderStatus };
};
