import React, { useMemo } from 'react';
import { X } from 'lucide-react';

export default function TicketModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  ticketItems, 
  orderData, 
  currentOrderId,
  currentOrderNumber,
  loading,
  tempQrId
}) {
  if (!isOpen) return null;

  const ticketTotal = useMemo(() => {
    return ticketItems.reduce((total, item) => total + (item.price * item.qty), 0);
  }, [ticketItems]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold">Ticket Digital</h3>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><X size={20} /></button>
        </div>
        
        <div className="p-6 bg-yellow-50 font-mono text-sm leading-relaxed border-b-2 border-dashed border-slate-300 overflow-y-auto flex-1">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Pizza Brava</h2>
            <p>Santa Ana, El Salvador</p>
            <p className="text-xs text-slate-500 mt-1">Av. Independencia Sur</p>
          </div>

          <div className="flex justify-between border-b border-slate-300 pb-2 mb-2 font-bold">
            <span>Orden: {currentOrderId ? `#${currentOrderNumber}` : 'PENDIENTE'}</span>
            <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>

          <div className="mb-4 text-xs space-y-1">
            <p><strong>Cliente:</strong> {orderData.customerName?.toUpperCase() || 'MOSTRADOR'}</p>
            <p><strong>Tipo:</strong> {orderData.orderType?.toUpperCase()}</p>
            {orderData.orderNotes && <p className="italic bg-white p-1 border border-slate-200 font-bold">"{orderData.orderNotes}"</p>}
          </div>

          <div className="space-y-2 mb-4 border-b border-slate-300 pb-4">
            {ticketItems.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.qty} x {item.name}</span>
                <span>${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-bold text-lg mb-6">
            <span>TOTAL</span>
            <span>${ticketTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-white p-2 mb-2 border border-slate-200">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(currentOrderId ? `https://pizzabrava.app/orders/${currentOrderId}` : `orden-temporal-${tempQrId}`)}`} 
                  alt="QR Code"
                  className="w-32 h-32"
                />
            </div>
            <p className="text-xs text-center text-slate-500">
              {currentOrderId ? 'Escanear para ver factura' : 'Confirmar para generar orden'}
            </p>
          </div>
        </div>

        <div className="p-4 flex gap-3 bg-white shrink-0">
          {!currentOrderId ? (
            <>
              <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg">Volver</button>
              <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg disabled:opacity-50">{loading ? 'Enviando...' : 'CONFIRMAR'}</button>
            </>
          ) : (
            <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg shadow-lg hover:bg-slate-800">Nueva Orden</button>
          )}
        </div>
      </div>
    </div>
  );
}