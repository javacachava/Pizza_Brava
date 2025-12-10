import { ReportsService } from '../domain/ReportsService';
import { MenuService } from '../domain/MenuService';
import { staticDocs } from './KnowledgeBase';

export class ContextRetriever {
    private reportsService = new ReportsService();
    private menuService = new MenuService();

    async retrieveContext(query: string, userRole: string): Promise<string> {
        const lowerQ = query.toLowerCase();
        let context = "";

        const relevantDocs = staticDocs.filter(doc => 
            doc.keywords.some(k => lowerQ.includes(k)) && 
            (doc.roleAccess.includes('all') || doc.roleAccess.includes(userRole as any))
        );

        if (relevantDocs.length > 0) {
            context += "INFORMACIÓN DE MANUALES:\n";
            relevantDocs.forEach(d => {
                context += `- ${d.title}: ${d.content}\n`;
            });
            context += "\n";
        }

        if (userRole === 'admin' && (lowerQ.includes('vendi') || lowerQ.includes('venta') || lowerQ.includes('caja'))) {
            const stats = await this.reportsService.getDashboardStats('day');
            context += `DATOS EN TIEMPO REAL (HOY):\n`;
            context += `- Ventas Totales: $${stats.totalSales.toFixed(2)}\n`;
            context += `- Órdenes: ${stats.totalOrders}\n`;
            context += `- Ticket Promedio: $${stats.averageTicket.toFixed(2)}\n`;
            context += `- Top Producto: ${stats.topProducts[0]?.name || 'N/A'}\n\n`;
        }

        if (lowerQ.includes('menu') || lowerQ.includes('precio') || lowerQ.includes('tienes')) {
            const menu = await this.menuService.getFullMenu();
            const flatItems = menu.flatMap(c => c.items).filter(i => i.isAvailable);
            
            const relevantItems = flatItems.filter(i => lowerQ.includes(i.name.toLowerCase()));
            
            if (relevantItems.length > 0) {
                context += "DATOS DEL MENÚ:\n";
                relevantItems.slice(0, 5).forEach(i => {
                    context += `- ${i.name}: $${i.price.toFixed(2)} (${i.description || 'Sin descripción'})\n`;
                });
                context += "\n";
            }
        }

        return context;
    }
}