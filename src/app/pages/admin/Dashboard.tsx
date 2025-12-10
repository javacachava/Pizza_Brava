import React, { useEffect, useState } from 'react';
import { ReportsService } from '../../../services/domain/ReportsService';
import { SimpleChart } from './components/SimpleChart';
import { Button } from '../../components/ui/Button';

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [range, setRange] = useState<'day' | 'week' | 'month'>('day');
    const reportsService = new ReportsService();

    useEffect(() => {
        reportsService.getDashboardStats(range).then(setStats);
    }, [range]);

    const handlePrint = () => {
        window.print();
    };

    if (!stats) return <div>Calculando métricas...</div>;

    return (
        <div className="printable-area">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>Reporte de Operaciones</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select 
                        value={range} 
                        onChange={(e) => setRange(e.target.value as any)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                    >
                        <option value="day">Hoy</option>
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mes</option>
                    </select>
                    <Button onClick={handlePrint}>🖨️ PDF / Imprimir</Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', borderLeft: '4px solid #3182ce' }}>
                    <div style={{ color: '#718096', fontSize: '0.9rem' }}>Ventas Totales</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>${stats.totalSales.toFixed(2)}</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', borderLeft: '4px solid #38a169' }}>
                    <div style={{ color: '#718096', fontSize: '0.9rem' }}>Órdenes Totales</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.totalOrders}</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', borderLeft: '4px solid #d69e2e' }}>
                    <div style={{ color: '#718096', fontSize: '0.9rem' }}>Ticket Promedio</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>${stats.averageTicket.toFixed(2)}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <SimpleChart 
                    title="Top 5 Productos Más Vendidos" 
                    color="#ff6b00"
                    data={stats.topProducts.map((p: any) => ({ label: p.name.slice(0, 10), value: p.count }))} 
                />
                
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem' }}>Detalle Top Ventas</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {stats.topProducts.map((p: any, i: number) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #edf2f7' }}>
                                <span>{i+1}. {p.name}</span>
                                <span style={{ fontWeight: 'bold' }}>${p.total.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};