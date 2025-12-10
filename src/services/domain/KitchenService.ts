import { OrdersRepository } from '../../repos/OrdersRepository';
import type { Order } from '../../models/Order';

export class KitchenService {
    private ordersRepo = new OrdersRepository();

    async getQueue(): Promise<Order[]> {
        return await this.ordersRepo.getActiveOrders();
    }

    async updateStatus(orderId: string, status: Order['status']): Promise<void> {
        await this.ordersRepo.update(orderId, { status });
    }
}