import { useEffect, useState, useCallback } from 'react';
import type { CashFlow } from '../models/CashFlow';
import type { ICashFlowRepository } from '../repos/interfaces/ICashFlowRepository';
import { CashService } from '../services/domain/CashService';
import { useAuthContext } from '../contexts/AuthContext';

export function useCashFlow(repo: ICashFlowRepository) {
  const service = new CashService(repo);
  const { user } = useAuthContext();

  const [summary, setSummary] = useState<any>(null);
  const [flows, setFlows] = useState<CashFlow[]>([]);
  const [loading, setLoading] = useState(false);

  // 🛡️ Filtro de roles permitidos para ver dinero
  const canViewFinance = user?.role === 'admin' || user?.role === 'recepcion';

  const load = useCallback(async () => {
    // SI NO TIENE PERMISO, ABORTAMOS
    if (!canViewFinance) return;

    setLoading(true);
    try {
      const all = await repo.getAll();
      setFlows(all);
      const info = await service.getDailySummary();
      setSummary(info);
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.error("Error loading cash flow:", e);
      }
    } finally {
      setLoading(false);
    }
  }, [canViewFinance, repo]);

  useEffect(() => {
    if (canViewFinance) {
      load();
    }
  }, [canViewFinance, load]);

  return { flows, summary, loading, add: service.register.bind(service), refresh: load };
}