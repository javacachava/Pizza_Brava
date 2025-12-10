// src/services/domain/ReportsService.ts
import { OrdersRepository } from '../../repos/OrdersRepository';
import { MenuRepository } from '../../repos/MenuRepository';
import type { Order } from '../../models/Order';
import type { MenuItem } from '../../models/MenuItem';

export class ReportsService {
  private ordersRepo = new OrdersRepository();
  private menuRepo = new MenuRepository();

  private toDate(d: any): Date {
    if (!d) return new Date(0);
    if (d instanceof Date) return d;
    if (d.toDate && typeof d.toDate === 'function') return d.toDate();
    return new Date(d);
  }

  async getDashboardStats(range: 'day' | 'week' | 'month' = 'day') {
    const allOrders = await this.ordersRepo.getAll();
    const now = new Date();

    const withinRange = (orderDate: Date) => {
      if (range === 'day') return orderDate.toDateString() === now.toDateString();
      if (range === 'week') {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        return orderDate >= oneWeekAgo && orderDate <= now;
      }
      if (range === 'month') {
        return orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth();
      }
      return true;
    };

    const filtered = allOrders.filter(o => {
      if (o.status === 'cancelled') return false;
      const d = this.toDate(o.createdAt);
      return withinRange(d);
    });

    const totalSales = filtered.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = filtered.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    const productMap: Record<string, { name: string; count: number; total: number; categoryId?: string }> = {};
    const menuIndex = (await this.menuRepo.getAll()).reduce<Record<string, MenuItem>>((acc, m) => {
      acc[m.id] = m;
      return acc;
    }, {});

    const salesByCategory: Record<string, number> = {};

    filtered.forEach(o => {
      o.items.forEach(it => {
        if (!productMap[it.productId]) {
          productMap[it.productId] = { name: it.productName, count: 0, total: 0, categoryId: menuIndex[it.productId]?.categoryId };
        }
        productMap[it.productId].count += it.quantity;
        productMap[it.productId].total += it.totalPrice;

        const catId = menuIndex[it.productId]?.categoryId;
        if (catId) {
          salesByCategory[catId] = (salesByCategory[catId] || 0) + it.totalPrice;
        }
      });
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSales,
      totalOrders,
      averageTicket,
      topProducts,
      salesByCategory,
      orders: filtered
    };
  }
}
