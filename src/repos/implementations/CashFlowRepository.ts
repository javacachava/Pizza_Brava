import { BaseRepository } from '../BaseRepository';
import type { CashFlow } from '../../models/CashFlow';
import type { ICashFlowRepository } from '../interfaces/ICashFlowRepository';
import { supabase } from '../../services/supabase';

export class CashFlowRepository extends BaseRepository<CashFlow> implements ICashFlowRepository {
  constructor() { super('cash_flow'); }

  async getAll(): Promise<CashFlow[]> { return super.getAll(); }

  async getDailySummary(): Promise<any> {
    const since = new Date();
    since.setHours(0,0,0,0); // Desde el inicio del día de hoy

    const { data: items, error } = await supabase
        .from(this.tableName)
        .select('*')
        .gte('created_at', since.toISOString());

    if (error) throw error;
    if (!items) return { income: 0, expense: 0, balance: 0, items: [] };

    const income = items.filter(i => i.type === 'income').reduce((s, x) => s + x.amount, 0);
    const expense = items.filter(i => i.type === 'expense').reduce((s, x) => s + x.amount, 0);
    
    return { income, expense, balance: income - expense, items };
  }
}