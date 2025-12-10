import { OrdersRepository } from '../../repos/OrdersRepository';
import { RulesRepository } from '../../repos/RulesRepository';
import { ComboService } from './ComboService';

import type { Order, OrderType } from '../../models/Order';
import type { OrderItem } from '../../models/OrderItem';

export class POSService {
    private ordersRepo = new OrdersRepository();
    private rulesRepo = new RulesRepository();
    private comboService = new ComboService();

    // Crear una orden completa
    async createOrder(
        items: OrderItem[],
        customerName: string,
        type: OrderType,
        userId: string,
        tableNumber?: string
    ): Promise<string> {
        if (items.length === 0) throw new Error("Order cannot be empty");

        const rules = await this.rulesRepo.getByKey('taxRate');
        const taxRate = (rules?.value as number) || 0;

        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        const newOrder: Omit<Order, 'id'> = {
            customerName,
            items,
            subtotal,
            tax,
            total,
            status: 'pending',
            type,
            createdAt: new Date(),
            createdBy: userId,
            tableNumber
        };

        return await this.ordersRepo.create(newOrder);
    }

    // Nuevo método: agregar combo al pedido
    async addComboToOrder(
        selections: { slotId: string; productId: string; quantity: number }[],
        comboId: string,
        orderQuantity = 1
    ) {
        // Validación real del combo usando ComboService
        const valid = await this.comboService.validateCombo(comboId, selections);
        if (!valid.valid) {
            throw new Error('Validación de combo: ' + valid.errors.join('; '));
        }

        // Construcción del OrderItem (combo expandido)
        const comboOrderItem = await this.comboService.buildOrderItemFromCombo(
            comboId,
            selections,
            orderQuantity
        );

        // Se devuelve el order item para que el consumidor lo agregue al carrito final
        return comboOrderItem as unknown as OrderItem;
    }
}
