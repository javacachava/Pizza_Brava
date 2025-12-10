import { BaseRepository } from './BaseRepository';
import type { Order, OrderStatus } from '../models/Order';
import { query, where, orderBy, getDocs } from 'firebase/firestore';

export class OrdersRepository extends BaseRepository<Order> {
    constructor() {
        super('orders');
    }

    async getByStatus(status: OrderStatus): Promise<Order[]> {
        const q = query(
            this.getCollection(), 
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    }
    
    async getActiveOrders(): Promise<Order[]> {
        const q = query(
             this.getCollection(),
             where('status', 'in', ['pending', 'preparing', 'ready']),
             orderBy('createdAt', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    }
}