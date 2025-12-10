import React, { useEffect, useState } from 'react';
import { ReportsService } from '../../../services/domain/ReportsService';
import { Button } from '../../components/ui/Button';

export const CashClose: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const service = new ReportsService();

    useEffect(() => {
        service.getDashboardStats('day').then(setData);
    }, []);

    if (!data) return <div>Cargando corte...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px dashed #cbd5e0', paddingBottom: '20px' }}>
                <h2>CORTE DE CAJA (Z)</h2>
                <p>{new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}</p>
                <p>Pizza Brava</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.2rem' }}>
                <span>Ventas Totales:</span>
                <span style={{ fontWeight: 'bold' }}>${data.totalSales.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Transacciones:</span>
                <span>{data.totalOrders}</span>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f7fafc', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Efectivo (Estimado):</span>
                    <span>${(data.totalSales * 0.8).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#718096' }}>
                    <span>Tarjeta/Transferencia:</span>
                    <span>${(data.totalSales * 0.2).toFixed(2)}</span>
                </div>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <Button onClick={() => window.print()} style={{ width: '100%' }}>🖨️ IMPRIMIR CORTE</Button>
            </div>
        </div>
    );
};