import React, { useEffect, useState } from 'react';
import { container } from '../../../models/di/container';
import { useCashFlow } from '../../../hooks/useCashFlow';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { formatPrice, formatDate } from '../../../utils/format';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

export const CashClose: React.FC = () => {
  const { summary, flows, loading, add, refresh } = useCashFlow(container.cashFlowRepo);
  const [isModalOpen, setModalOpen] = useState(false);
  const [moveType, setMoveType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const handleSave = async () => {
    if (!amount || !desc) return alert('Completa los campos');
    await add(moveType, parseFloat(amount), desc);
    setModalOpen(false);
    setAmount('');
    setDesc('');
  };

  const openModal = (type: 'income' | 'expense') => {
    setMoveType(type);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cierre de Caja</h1>
          <p className="text-slate-500">Resumen financiero del día</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}>Actualizar</Button>
          <Button onClick={() => window.print()} variant="secondary">🖨️ Imprimir Cierre</Button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full text-green-600"><TrendingUp /></div>
          <div>
            <p className="text-sm text-green-700 font-medium">Ingresos Totales</p>
            <p className="text-2xl font-bold text-green-800">{summary ? formatPrice(summary.income) : '...'}</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full text-red-600"><TrendingDown /></div>
          <div>
            <p className="text-sm text-red-700 font-medium">Gastos / Salidas</p>
            <p className="text-2xl font-bold text-red-800">{summary ? formatPrice(summary.expense) : '...'}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Wallet /></div>
          <div>
            <p className="text-sm text-blue-700 font-medium">Balance en Caja</p>
            <p className="text-2xl font-bold text-blue-800">{summary ? formatPrice(summary.balance) : '...'}</p>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-slate-700 self-center mr-auto">Caja Chica:</h3>
        <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => openModal('income')}>
          + Ingresar Efectivo
        </Button>
        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => openModal('expense')}>
          - Registrar Gasto
        </Button>
      </div>

      {/* Historial de Movimientos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-700">Movimientos del Día</h3>
        </div>
        <DataTable 
          data={flows}
          columns={[
            { header: 'Hora', accessor: (f) => new Date(f.createdAt as any).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
            { header: 'Tipo', accessor: (f) => f.type === 'income' ? <span className="text-green-600 font-bold">Ingreso</span> : <span className="text-red-600 font-bold">Gasto</span> },
            { header: 'Descripción', accessor: 'description' },
            { header: 'Monto', accessor: (f) => <span className={f.type === 'income' ? 'text-green-700' : 'text-red-700'}>{formatPrice(f.amount)}</span> }
          ]}
        />
      </div>

      {/* Modal para registrar movimiento */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={moveType === 'income' ? 'Ingresar Dinero' : 'Registrar Gasto'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400">$</span>
              <input 
                type="number" 
                className="input-field pl-8" 
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <input 
              className="input-field" 
              placeholder={moveType === 'income' ? "Ej: Cambio inicial" : "Ej: Compra de Hielo"}
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button 
              className={moveType === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              onClick={handleSave}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};