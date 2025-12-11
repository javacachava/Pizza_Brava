import { useEffect, useState, useCallback } from 'react';
import type { Order } from '../models/Order';
import type { IOrderRepository } from '../repos/interfaces/IOrderRepository';
import { KitchenService } from '../services/domain/KitchenService';
import { useAuthContext } from '../contexts/AuthContext';

export function useKitchen(orderRepo: IOrderRepository) {
  const service = new KitchenService(orderRepo);
  const { isAuthenticated } = useAuthContext();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return; // 🛑

    setLoading(true);
    try {
      const pending = await service.getPending();
      setOrders(pending);
    } catch (e) {
      console.error("Error loading kitchen orders:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markPreparing = useCallback(async (id: string) => {
    await service.markPreparing(id);
    await load();
  }, [load]);

  const markReady = useCallback(async (id: string) => {
    await service.markReady(id);
    await load();
  }, [load]);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  return { orders, loading, refresh: load, markPreparing, markReady };
}