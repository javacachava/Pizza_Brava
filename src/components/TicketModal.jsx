import React, { useMemo } from 'react';
import { X, Phone, MapPin } from 'lucide-react';

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
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg">
            {currentOrderId ? 'Ticket Final' : 'Confirmar Pedido'}
          </h3>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><X size={20} /></button>
        </div>
        
        {/* Body */}
        <div className="p-6 bg-yellow-50 font-mono text-sm leading-relaxed border-b-2 border-dashed border-slate-300 overflow-y-auto flex-1">
          
          {/* Encabezado del Ticket */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Pizza Brava</h2>
            <p className="text-slate-600">Santa Ana, El Salvador</p>
            <p className="text-xs text-slate-400 mt-1">Av. Independencia Sur</p>
          </div>

          {/* Info Orden */}
          <div className="flex justify-between border-b border-slate-300 pb-2 mb-4 font-bold text-slate-800">
            <span>Orden: {currentOrderId ? `#${currentOrderNumber}` : 'PENDIENTE'}</span>
            <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>

          {/* Datos Cliente */}
          <div className="mb-6 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Tipo:</span>
              <span className="font-bold uppercase">{orderData.orderType}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-bold uppercase">{orderData.customerName}</span>
            </div>

            {/* Datos extra para Teléfono */}
            {orderData.orderType === 'telefono' && (
              <>
                <div className="flex gap-2 items-start pt-1 border-t border-slate-200 mt-1">
                  <Phone size={12} className="mt-0.5 shrink-0" />
                  <span>{orderData.phone}</span>
                </div>
                <div className="flex gap-2 items-start">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span className="break-words">{orderData.address}</span>
                </div>
                {orderData.deliveryNotes && (
                  <p className="italic text-slate-500 mt-1">Ref: "{orderData.deliveryNotes}"</p>
                )}
              </>
            )}

            {/* Notas generales (Local) */}
            {orderData.orderType === 'local' && orderData.notes && (
              <p className="italic bg-white p-1 border border-slate-200 mt-2">Note: "{orderData.notes}"</p>
            )}
          </div>

          {/* Detalle de Items */}
          <div className="space-y-3 mb-6 border-t border-slate-300 pt-4">
            {ticketItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex gap-2">
                  <span className="font-bold">{item.qty}</span>
                  <span className="max-w-[180px] leading-tight">{item.name}</span>
                </div>
                <span className="font-bold">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="flex justify-between font-bold text-xl border-t-2 border-slate-800 pt-2">
            <span>TOTAL</span>
            <span>${ticketTotal.toFixed(2)}</span>
          </div>
          
          {/* QR */}
          <div className="flex flex-col items-center mt-8">
            <div className="bg-white p-2 mb-2 border border-slate-200 shadow-sm">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(currentOrderId ? `https://pizzabrava.app/orders/${currentOrderId}` : `orden-temporal-${tempQrId}`)}`} 
                  alt="QR Code"
                  className="w-32 h-32"
                />
            </div>
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest">
              {currentOrderId ? 'Escanea tu recibo digital' : 'Confirmación pendiente'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 flex gap-3 bg-white shrink-0 border-t border-slate-100">
          {!currentOrderId ? (
            <>
              <button 
                onClick={onClose} 
                className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Editar
              </button>
              <button 
                onClick={onConfirm} 
                disabled={loading} 
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 disabled:opacity-50 transition-all"
              >
                {loading ? 'Enviando...' : 'CONFIRMAR'}
              </button>
            </>
          ) : (
            <button 
              onClick={onClose} 
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all"
            >
              Nueva Orden
            </button>
          )}
        </div>
      </div>
    </div>
  );
}