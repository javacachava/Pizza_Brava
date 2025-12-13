import { BaseRepository } from '../BaseRepository';
import type { Order } from '../../models/Order';
import type { IOrderRepository } from '../interfaces/IOrderRepository';
import { supabase } from '../../services/supabase';

export class OrdersRepository extends BaseRepository<Order> implements IOrderRepository {
  constructor() { 
    // Nombre exacto de la tabla en Supabase (PASO 1)
    super('orders'); 
  }

  // --- TRADUCTOR: DE BASE DE DATOS (snake_case) A APP (camelCase) ---
  private mapToModel(d: any): Order {
    return {
      id: d.id,
      tableNumber: d.table_number,   // Traducción
      customerName: d.customer_name, // Traducción
      orderType: d.order_type,       // Traducción
      status: d.status,
      total: d.total,
      subTotal: d.sub_total,         // Traducción
      tax: d.tax,
      tip: d.tip,
      items: typeof d.items === 'string' ? JSON.parse(d.items) : d.items,
      createdBy: d.created_by,       // Traducción
      createdAt: d.created_at,       // Traducción
      updatedAt: d.updated_at,       // Traducción
      meta: d.meta
    } as Order;
  }

  // --- TRADUCTOR: DE APP (camelCase) A BASE DE DATOS (snake_case) ---
  private mapToDb(o: Partial<Order>): any {
    const dbObj: any = { ...o };
    // Eliminamos campos indefinidos para no sobrescribir con null
    if (o.tableNumber !== undefined) dbObj.table_number = o.tableNumber;
    if (o.customerName !== undefined) dbObj.customer_name = o.customerName;
    if (o.orderType !== undefined) dbObj.order_type = o.orderType;
    if (o.subTotal !== undefined) dbObj.sub_total = o.subTotal;
    if (o.createdBy !== undefined) dbObj.created_by = o.createdBy;
    // status, total, tax, tip se llaman igual
    
    // Limpieza de campos camelCase que no existen en DB
    delete dbObj.tableNumber;
    delete dbObj.customerName;
    delete dbObj.orderType;
    delete dbObj.subTotal;
    delete dbObj.createdBy;
    delete dbObj.createdAt; // Supabase lo pone automático
    delete dbObj.updatedAt;
    
    return dbObj;
  }

  async create(order: Order): Promise<Order> {
    const dbPayload = this.mapToDb(order);
    
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      console.error("Error creando orden:", error);
      throw error;
    }
    return this.mapToModel(data);
  }

  async getActiveOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .in('status', ['pendiente', 'preparando', 'listo'])
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(d => this.mapToModel(d));
  }

  async getByStatus(statuses: string[]): Promise<Order[]> {
    if (statuses.length === 0) return [];
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .in('status', statuses)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(d => this.mapToModel(d));
  }

  // Sobrescribimos getAll para usar el mapeo
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase.from(this.tableName).select('*');
    if (error) throw error;
    return (data || []).map(d => this.mapToModel(d));
  }

  async getSummary(range: 'day' | 'week' | 'month'): Promise<any> {
    // Implementación simplificada para evitar errores por ahora
    return { totalSales: 0, totalOrders: 0, averageTicket: 0, topProducts: [] };
  }
}