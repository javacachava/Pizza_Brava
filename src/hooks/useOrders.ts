import { useState, useEffect } from 'react';
import { OrdersRepository } from '../repos/OrdersRepository';
import type { Order } from '../models/Order';

export const useOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const repo = new OrdersRepository();

    useEffect(() => {
        repo.getAll().then(setOrders);
    }, []);

    return { orders };
};
