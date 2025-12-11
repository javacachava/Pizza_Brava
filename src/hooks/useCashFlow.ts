import { useEffect, useState, useCallback } from 'react';
import type { CashFlow } from '../models/CashFlow';
import type { ICashFlowRepository } from '../repos/interfaces/ICashFlowRepository';
import { CashService } from '../services/domain/CashService';
import { useAuthContext } from '../contexts/AuthContext'; // 1. Importar Auth

export function useCashFlow(repo: ICashFlowRepository) {
  const service = new CashService(repo);
  const { user } = useAuthContext(); // 2. Obtener usuario

  const [summary, setSummary] = useState<any>(null);
  const [flows, setFlows] = useState<CashFlow[]>([]);
  const [loading, setLoading] = useState(false);

  // Definir roles permitidos para ver finanzas
  const canViewFinance = user?.role === 'admin' || user?.role === 'recepcion';

  const load = useCallback(async () => {
    // 🛑 3. ESCUDO: Solo admin y recepcion pasan
    if (!canViewFinance) return;

    setLoading(true);
    try {
      const all = await repo.getAll();
      setFlows(all);

      const info = await service.getDailySummary();
      setSummary(info);
    } catch (e) {
      console.error("Error loading cash flow:", e);
    } finally {
      setLoading(false);
    }
  }, [canViewFinance, repo]); // Dependencias

  const add = useCallback(async (type: 'income' | 'expense', amount: number, desc?: string) => {
    await service.register(type, amount, desc);
    await load();
  }, [load]);

  useEffect(() => {
    if (canViewFinance) {
      load();
    }
  }, [canViewFinance, load]);

  return { flows, summary, loading, add, refresh: load };
}