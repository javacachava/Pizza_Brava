import { 
    collection, 
    doc, 
    runTransaction, 
    query, 
    where, 
    orderBy, 
    getDocs,
    Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase'; // Singleton existente
import { BaseRepository } from './BaseRepository';
import type { Order, OrderStatus } from '../models/Order';

export class OrdersRepository extends BaseRepository<Order> {
    constructor() {
        super('orders');
    }

    async createTransactional(orderData: Omit<Order, 'id' | 'orderNumber'>): Promise<string> {
        try {
            return await runTransaction(db, async (transaction) => {
                const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                const counterRef = doc(db, 'counters', `orders-${todayStr}`);
                
                const counterDoc = await transaction.get(counterRef);
                
                let newSequence = 1;
                if (counterDoc.exists()) {
                    newSequence = counterDoc.data().current + 1;
                    transaction.update(counterRef, { current: newSequence });
                } else {
                    transaction.set(counterRef, { current: newSequence });
                }

                const orderNumber = `${todayStr.replace(/-/g, '')}-${newSequence.toString().padStart(4, '0')}`;

                const newOrderRef = doc(collection(db, this.collectionName));
                
                const finalOrder: Order = {
                    ...orderData,
                    id: newOrderRef.id,
                    orderNumber: orderNumber,
                    createdAt: Timestamp.now()
                };

                transaction.set(newOrderRef, finalOrder);

                return newOrderRef.id;
            });
        } catch (error) {
            console.error("Error transaccional creando orden:", error);
            throw new Error("No se pudo procesar la orden. Intente nuevamente.");
        }
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