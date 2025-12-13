import React, { useEffect, useState, useRef } from 'react';
import { useKitchenContext } from '../../../contexts/KitchenContext';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { LogOut, Clock, CheckCircle, ChefHat, Flame, RefreshCw, Bell } from 'lucide-react';
import type { Order } from '../../../models/Order';

export const KitchenPage: React.FC = () => {
  const { orders, loading, refresh, markPreparing, markReady } = useKitchenContext();
  const { logout } = useAuthContext();
  const [now, setNow] = useState(Date.now());
  
  // Referencia para el sonido y conteo previo
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrdersCount = useRef(0);

  // Inicializar Audio
  useEffect(() => {
    audioRef.current = new Audio('/cocina.mp3');
    // Pre-cargar para evitar lag
    audioRef.current.load();
  }, []);

  // Detector de Nuevas Órdenes (Efecto de Sonido)
  useEffect(() => {
    if (orders.length > prevOrdersCount.current) {
      // Si hay MÁS órdenes que antes, sonar campana
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Interacción de audio requerida:", e));
      }
    }
    prevOrdersCount.current = orders.length;
  }, [orders]);

  // Refrescar órdenes cada 15s (más rápido para cocina real)
  useEffect(() => {
    const interval = setInterval(() => {
        refresh();
        setNow(Date.now());
    }, 15000); // 15 segundos
    return () => clearInterval(interval);
  }, [refresh]);

  // Reloj local (cada minuto)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading && orders.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        <p className="animate-pulse">Sincronizando KDS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header KDS */}
      <header className="flex justify-between items-center bg-slate-900/90 backdrop-blur-md p-4 border-b border-slate-800 shadow-xl sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-900/30 animate-pulse">
            <ChefHat size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none uppercase">Cocina</h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
               <p className="text-slate-400 text-xs font-medium">En vivo</p>
            </div>
          </div>
          
          <div className="ml-6 flex items-center gap-3">
             <span className="bg-slate-800 text-orange-400 px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 flex items-center gap-2 shadow-inner">
               <Flame size={16} className={orders.length > 5 ? 'text-red-500 animate-bounce' : ''} />
               {orders.length} PENDIENTES
             </span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={refresh} 
            className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </Button>
          <button 
            onClick={logout} 
            className="p-3 text-slate-400 hover:text-red-400 transition-colors hover:bg-slate-800 rounded-xl"
            title="Cerrar Turno"
          >
            <LogOut size={24} />
          </button>
        </div>
      </header>

      {/* Grid de Tickets */}
      <main className="flex-1 p-6 overflow-y-auto bg-[url('/pattern.png')] bg-repeat opacity-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
          {orders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-[60vh] text-slate-600 space-y-6">
              <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center border-4 border-slate-800">
                 <Bell size={64} className="opacity-50" />
              </div>
              <div className="text-center">
                 <p className="text-3xl font-light text-slate-400">Todo limpio, Chef.</p>
                 <p className="text-sm opacity-50 mt-2">Listo para la acción</p>
              </div>
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

// Sub-componente: Ticket Individual Mejorado
const OrderTicket = ({ order, now, onPreparing, onReady }: { order: Order, now: number, onPreparing: () => void, onReady: () => void }) => {
  const isPending = order.status === 'pendiente' || order.status === 'preparando';
  const createdAt = new Date(order.createdAt as any).getTime();
  const minutesElapsed = Math.floor((now - createdAt) / 60000);
  
  // Lógica Semáforo + Pánico
  let statusClasses = 'border-slate-700 bg-slate-800'; // Normal
  let headerColor = 'bg-slate-700/50';
  let timerColor = 'text-slate-400';
  
  if (minutesElapsed >= 20) {
    // MODO PÁNICO CRÍTICO
    statusClasses = 'border-red-600 bg-red-950/30 shadow-[0_0_15px_rgba(220,38,38,0.3)] animate-pulse ring-2 ring-red-500';
    headerColor = 'bg-red-900 text-white';
    timerColor = 'text-white font-black animate-bounce';
  } else if (minutesElapsed >= 10) {
    // ADVERTENCIA
    statusClasses = 'border-yellow-600 bg-yellow-950/20';
    headerColor = 'bg-yellow-800/80 text-white';
    timerColor = 'text-yellow-200 font-bold';
  } else if (order.status === 'preparando') {
    // EN PROCESO (Activo)
    statusClasses = 'border-blue-500 bg-blue-950/20 ring-1 ring-blue-500/50';
    headerColor = 'bg-blue-900/60';
    timerColor = 'text-blue-300 font-bold';
  }

  return (
    <div className={`
      flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-300 relative group
      ${statusClasses}
    `}>
      {/* Ticket Header */}
      <div className={`p-3 flex justify-between items-start ${headerColor} transition-colors`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tight">
              #{order.tableNumber ? `Mesa ${order.tableNumber}` : 'Llevar'}
            </span>
            {order.orderType === 'pedido' && (
              <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] uppercase font-black rounded shadow-sm tracking-wider">
                APP
              </span>
            )}
          </div>
          <span className="text-xs opacity-90 font-medium block truncate max-w-[140px] mt-0.5">
            {order.customerName || 'Cliente General'}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 font-mono text-lg ${timerColor} bg-black/20 px-2 py-1 rounded`}>
          <Clock size={16} strokeWidth={2.5} />
          {minutesElapsed}m
        </div>
      </div>

      {/* Ticket Body */}
      <div className="p-4 flex-1 space-y-4 min-h-[200px]">
        {order.items.map((item, idx) => (
          <div key={idx} className="border-b border-white/10 last:border-0 pb-3 last:pb-0">
            <div className="flex gap-3">
              {/* Cantidad Grande */}
              <div className="flex flex-col items-center justify-start w-8 shrink-0">
                 <span className="font-black text-2xl text-orange-500 leading-none">
                   {item.quantity}
                 </span>
                 <span className="text-[10px] text-gray-500 uppercase">UND</span>
              </div>
              
              <div className="flex-1">
                <p className="text-slate-100 font-bold text-lg leading-tight">
                  {item.productName}
                </p>
                {item.isCombo && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-orange-300 bg-orange-900/40 px-2 py-0.5 rounded-full mt-1 font-bold tracking-wide">
                    COMBO
                  </span>
                )}
                
                {/* Modificadores / Notas */}
                {(item.comment || (item.selectedOptions && item.selectedOptions.length > 0)) && (
                  <div className="mt-2 bg-black/20 p-2.5 rounded-lg border border-white/5">
                    {item.selectedOptions?.map(opt => (
                      <div key={opt.id} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
                        {opt.name}
                      </div>
                    ))}
                    {item.comment && (
                      <p className="text-yellow-300 text-sm font-medium italic mt-1.5 pt-1.5 border-t border-white/10 flex items-start gap-1">
                        <span className="opacity-50">📝</span> {item.comment}
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
      <div className="p-3 bg-black/20 border-t border-white/5">
        {order.status === 'pendiente' ? (
          <button 
            onClick={onPreparing}
            className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2 group hover:shadow-lg active:scale-[0.98]"
          >
            <Flame size={20} className="text-orange-500 group-hover:scale-125 transition-transform duration-300" fill="currentColor" />
            MARCAR EN HORNO
          </button>
        ) : (
          <button 
            onClick={onReady}
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black tracking-wide transition-all flex justify-center items-center gap-2 shadow-lg shadow-green-900/30 hover:shadow-green-500/20 active:scale-[0.98]"
          >
            <CheckCircle size={22} />
            ¡TERMINADO!
          </button>
        )}
      </div>
    </div>
  );
};