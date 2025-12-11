import { useEffect, useState, useCallback } from 'react';
import type { IOrderRepository } from '../repos/interfaces/IOrderRepository';
import type { Order } from '../models/Order';
import type { OrderItem } from '../models/OrderItem';
import { OrdersService } from '../services/domain/OrdersService';
import { useAuthContext } from '../contexts/AuthContext';

export function useOrders(orderRepo: IOrderRepository) {
  const service = new OrdersService(orderRepo);
  const { isAuthenticated } = useAuthContext();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const loadActive = useCallback(async () => {
    if (!isAuthenticated) return; // 🛑

    setLoading(true);
    try {
      const list = await service.getActiveOrders();
      setOrders(list);
    } catch (e) {
      console.error("Error loading orders:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const createOrder = useCallback(async (order: Order) => service.createOrder(order), []);
  const addItem = useCallback(async (id: string, item: OrderItem) => service.addItem(id, item), []);
  const updateStatus = useCallback(async (id: string, status: Order['status']) => service.updateStatus(id, status), []);

  useEffect(() => {
    if (isAuthenticated) {
      loadActive();
    }
  }, [isAuthenticated, loadActive]);

  return { orders, loading, createOrder, addItem, updateStatus, refresh: loadActive };
}