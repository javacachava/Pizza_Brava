import type { OrderItem } from "./OrderItem";

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export interface Order {
    id?: string;
    customerName: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: OrderStatus;
    type: OrderType;
    createdAt: Date | any;
    createdBy: string;
    tableNumber?: string;
}
