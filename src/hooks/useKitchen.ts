import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Order } from '../models/Order';
import type { IOrderRepository } from '../repos/interfaces/IOrderRepository';
import { KitchenService } from '../services/domain/KitchenService';
import { useAuthContext } from '../contexts/AuthContext';

export function useKitchen(orderRepo: IOrderRepository) {
  // CORRECCIÓN: Usamos useMemo para instanciar el servicio.
  // Esto evita que se cree una nueva instancia en cada render ("new KitchenService"),
  // lo cual rompía la estabilidad de las dependencias en los useEffects subsiguientes.
  const service = useMemo(() => new KitchenService(orderRepo), [orderRepo]);
  
  const { isAuthenticated } = useAuthContext();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // ============================================
  // LOAD: Carga de órdenes
  // ============================================
  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    
    // Evitamos spinner si ya hay datos, para que la actualización sea silenciosa en refrescos automáticos
    // Solo ponemos loading = true si no tenemos órdenes previas (carga inicial)
    setLoading(prev => prev || orders.length === 0); 
    
    try {
      const pending = await service.getPending();
      setOrders(pending);
    } catch (e) {
      console.error("Error loading kitchen orders:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, service]); // 'service' ahora es estable gracias a useMemo

  // ============================================
  // ACCIONES
  // ============================================
  const markPreparing = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;
      try {
        await service.markPreparing(id);
        await load();
      } catch (error) {
        console.error("Error marking preparing:", error);
      }
    },
    [isAuthenticated, load, service]
  );

  const markReady = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;
      try {
        await service.markReady(id);
        await load();
      } catch (error) {
        console.error("Error marking ready:", error);
      }
    },
    [isAuthenticated, load, service]
  );

  // ============================================
  // EFECTO DE CARGA INICIAL
  // ============================================
  useEffect(() => {
    let mounted = true;

    if (isAuthenticated) {
      load();
    }

    return () => { mounted = false; };
  }, [isAuthenticated, load]);

  return {
    orders,
    loading,
    refresh: load,
    markPreparing,
    markReady,
  };
}