import { BaseRepository } from '../BaseRepository';
import type { Order } from '../../models/Order';
import type { IOrderRepository } from '../interfaces/IOrderRepository';
import { supabase } from '../../services/supabase';

export class OrdersRepository extends BaseRepository<Order> implements IOrderRepository {
  constructor() { super('orders'); }

  async create(order: Order): Promise<Order> {
    // Supabase genera created_at automático, pero si quieres enviarlo manual:
    const withTimestamps = { ...order, created_at: new Date().toISOString() };
    return super.create(withTimestamps as any);
  }

  async getActiveOrders(): Promise<Order[]> {
    // Traer órdenes pendientes, preparando o listas
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .in('status', ['pendiente', 'preparando', 'listo'])
      .order('created_at', { ascending: true }); // Las más viejas primero

    if (error) throw error;
    return data as Order[];
  }

  async getByStatus(statuses: string[]): Promise<Order[]> {
    if (statuses.length === 0) return [];
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .in('status', statuses)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Order[];
  }

  async getSummary(range: 'day' | 'week' | 'month'): Promise<any> {
    // Cálculo de fechas
    const now = new Date();
    let since = new Date();
    
    if (range === 'day') since.setDate(now.getDate() - 1);
    if (range === 'week') since.setDate(now.getDate() - 7);
    if (range === 'month') since.setDate(now.getDate() - 30);

    const { data: orders, error } = await supabase
      .from(this.tableName)
      .select('*')
      .gte('created_at', since.toISOString()) // Mayor o igual a la fecha
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!orders) return { totalSales: 0, totalOrders: 0, averageTicket: 0, topProducts: [] };

    // Lógica de JS para sumarizar (igual que antes)
    const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = orders.length;
    const avg = totalOrders ? totalSales / totalOrders : 0;

    // Conteo básico de productos (esto podría ser una función RPC en el futuro)
    const productCounts: Record<string, { name: string; count: number; total: number }> = {};
    orders.forEach((o: any) => {
      // Nota: en Supabase 'items' viene como JSON, asegúrate de parsearlo si no es automático
      const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
      
      (items || []).forEach((it: any) => {
        const pid = it.productId || 'combo';
        if (!productCounts[pid]) productCounts[pid] = { name: it.productName, count: 0, total: 0 };
        productCounts[pid].count += it.quantity;
        productCounts[pid].total += it.totalPrice;
      });
    });

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalSales, totalOrders, averageTicket: avg, topProducts };
  }
}