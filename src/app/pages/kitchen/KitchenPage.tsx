import React, { useEffect, useState } from 'react';
import { useKitchenContext } from '../../../contexts/KitchenContext';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { LogOut, Clock, CheckCircle, ChefHat, Flame, RefreshCw } from 'lucide-react';
import type { Order } from '../../../models/Order';

export const KitchenPage: React.FC = () => {
  const { orders, loading, refresh, markPreparing, markReady } = useKitchenContext();
  const { logout } = useAuthContext();
  const [now, setNow] = useState(Date.now());

  // Refrescar órdenes cada 30s
  useEffect(() => {
    const interval = setInterval(() => {
        refresh();
        setNow(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Actualizar contador de tiempo cada minuto para que la UI cambie de color
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading && orders.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        <p className="animate-pulse">Conectando con cocina...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header KDS */}
      <header className="flex justify-between items-center bg-slate-900 p-4 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-orange-600 rounded-lg shadow-lg shadow-orange-900/20">
            <ChefHat size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-none">KDS Cocina</h1>
            <p className="text-slate-400 text-xs mt-1">Pizza Brava System</p>
          </div>
          <span className="ml-4 bg-slate-800 text-orange-400 px-4 py-1.5 rounded-full text-sm font-bold border border-slate-700 flex items-center gap-2">
            <Flame size={14} className={orders.length > 5 ? 'animate-pulse text-red-500' : ''} />
            {orders.length} Pendientes
          </span>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={refresh} 
            className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </Button>
          <button 
            onClick={logout} 
            className="p-2 text-slate-400 hover:text-red-400 transition-colors hover:bg-slate-800 rounded-lg"
            title="Cerrar Turno"
          >
            <LogOut size={24} />
          </button>
        </div>
      </header>

      {/* Grid de Tickets */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {orders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-[60vh] text-slate-600">
              <ChefHat size={80} strokeWidth={1} />
              <p className="mt-4 text-2xl font-light">Todo listo, Chef.</p>
              <p className="text-sm opacity-50">Esperando nuevas comandas...</p>
            </div>
          ) : (
            orders.map((order: Order) => (
              <OrderTicket 
                key={order.id} 
                order={order} 
                now={now}
                onPreparing={() => markPreparing(order.id)}
                onReady={() => markReady(order.id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

// Sub-componente: Ticket Individual
const OrderTicket = ({ order, now, onPreparing, onReady }: { order: Order, now: number, onPreparing: () => void, onReady: () => void }) => {
  const isPending = order.status === 'pendiente' || order.status === 'preparando';
  const createdAt = new Date(order.createdAt as any).getTime();
  const minutesElapsed = Math.floor((now - createdAt) / 60000);
  
  // Semáforo de tiempo
  let headerColor = 'bg-slate-700';
  let timerColor = 'text-slate-400';
  
  if (minutesElapsed > 20) {
    headerColor = 'bg-red-900/80 border-b border-red-700'; // Crítico
    timerColor = 'text-red-300 font-bold animate-pulse';
  } else if (minutesElapsed > 10) {
    headerColor = 'bg-yellow-900/60 border-b border-yellow-700'; // Advertencia
    timerColor = 'text-yellow-300 font-bold';
  } else if (!isPending) {
    headerColor = 'bg-blue-900/50 border-b border-blue-700'; // En preparación
    timerColor = 'text-blue-300';
  }

  return (
    <div className={`
      flex flex-col rounded-xl overflow-hidden border shadow-lg transition-all duration-300
      ${isPending ? 'border-slate-700 bg-slate-800' : 'border-blue-500/50 bg-slate-800 ring-1 ring-blue-500/30'}
    `}>
      {/* Ticket Header */}
      <div className={`p-3 flex justify-between items-start ${headerColor}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white">
              #{order.tableNumber ? `Mesa ${order.tableNumber}` : 'Llevar'}
            </span>
            {order.orderType === 'pedido' && (
              <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] uppercase font-bold rounded">Delivery</span>
            )}
          </div>
          <span className="text-xs text-white/70 block truncate max-w-[140px]">
            {order.customerName || 'Cliente'}
          </span>
        </div>
        <div className={`flex items-center gap-1 font-mono text-sm ${timerColor}`}>
          <Clock size={14} />
          {minutesElapsed}m
        </div>
      </div>

      {/* Ticket Body */}
      <div className="p-4 flex-1 space-y-3 min-h-[180px]">
        {order.items.map((item, idx) => (
          <div key={idx} className="border-b border-slate-700/50 last:border-0 pb-2 last:pb-0">
            <div className="flex gap-3">
              <span className="font-bold text-xl text-orange-500 font-mono w-6 text-center shrink-0">
                {item.quantity}
              </span>
              <div className="flex-1">
                <p className="text-slate-200 font-medium leading-tight">
                  {item.productName}
                </p>
                {item.isCombo && (
                  <span className="inline-block text-[10px] text-orange-300 bg-orange-900/30 px-1.5 rounded mt-0.5">
                    Combo
                  </span>
                )}
                
                {/* Modificadores / Comentarios */}
                {(item.comment || (item.selectedOptions && item.selectedOptions.length > 0)) && (
                  <div className="mt-1.5 bg-slate-900/50 p-2 rounded border border-slate-700/50">
                    {item.selectedOptions?.map(opt => (
                      <div key={opt.id} className="flex items-center gap-1.5 text-xs text-slate-300">
                        <span className="w-1 h-1 rounded-full bg-green-500"></span>
                        {opt.name}
                      </div>
                    ))}
                    {item.comment && (
                      <p className="text-yellow-200/90 text-xs italic mt-1 border-t border-slate-700/50 pt-1">
                        "{item.comment}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Actions */}
      <div className="p-2 bg-slate-900/50 border-t border-slate-800">
        {isPending ? (
          <button 
            onClick={onPreparing}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all flex justify-center items-center gap-2 group"
          >
            <Flame size={18} className="text-orange-500 group-hover:scale-110 transition-transform" />
            Cocinar
          </button>
        ) : (
          <button 
            onClick={onReady}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-all flex justify-center items-center gap-2 shadow-lg shadow-green-900/20"
          >
            <CheckCircle size={18} />
            ¡Listo!
          </button>
        )}
      </div>
    </div>
  );
};