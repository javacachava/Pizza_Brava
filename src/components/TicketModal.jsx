// src/components/TicketModal.jsx
import React, { useMemo } from "react";
import { X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react"; // <--- 1. IMPORTAR LIBRERÍA

export default function TicketModal({
  isOpen,
  onClose,
  onConfirm,
  ticketItems = [],
  orderData = {},
  currentOrderId,
  currentOrderNumber,
  loading,
  tempQrId
}) {
  if (!isOpen) return null;

  const ticketTotal = useMemo(() => {
    if (!Array.isArray(ticketItems)) return 0;
    return ticketItems.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.qty || 1),
      0
    );
  }, [ticketItems]);

  const {
    orderType = "Mostrador",
    customerName = "Cliente Mostrador",
    customerPhone,
    customerAddress,
    orderNotes,
    paymentMethod
  } = orderData || {};

  const qrData = currentOrderId
    ? `https://pizzabrava.app/orders/${currentOrderId}`
    : `orden-temporal-${tempQrId}`;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center px-4 py-6"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden">
        {/* Lado izquierdo: Ticket estilo térmico */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-400">
                Resumen de orden
              </p>
              <p className="text-sm font-semibold text-slate-100">
                {currentOrderId
                  ? `Orden #${currentOrderNumber}`
                  : "Orden pendiente de enviar"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              disabled={loading}
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 bg-yellow-50 font-mono text-sm leading-relaxed text-slate-900 border-b-2 border-dashed border-slate-400 overflow-y-auto flex-1">
            <div className="text-center mb-4">
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">
                Pizza Brava
              </h2>
              <p className="text-xs text-slate-700">Santa Ana, El Salvador</p>
            </div>

            <div className="flex justify-between border-b border-slate-400 pb-2 mb-2 font-bold text-xs">
              <span>
                Orden:{" "}
                {currentOrderId ? `#${currentOrderNumber}` : "PENDIENTE"}
              </span>
              <span>
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>

            <div className="mb-4 text-[11px] space-y-1">
              <p>
                <strong>Cliente:</strong>{" "}
                {customerName || "Cliente Mostrador"}
              </p>
              {customerPhone && (
                <p>
                  <strong>Tel:</strong> {customerPhone}
                </p>
              )}
              {customerAddress && (
                <p>
                  <strong>Dirección:</strong> {customerAddress}
                </p>
              )}
              <p>
                <strong>Tipo de orden:</strong> {orderType}
              </p>
              {paymentMethod && (
                <p>
                  <strong>Pago:</strong> {paymentMethod}
                </p>
              )}
              {orderNotes && (
                <p className="mt-1">
                  <strong>Notas:</strong> {orderNotes}
                </p>
              )}
            </div>

           <div className="border-t border-slate-400 pt-2 mt-2 text-xs">
              {ticketItems && ticketItems.length > 0 ? (
                ticketItems.map((item, idx) => (
                  <div
                    key={item.cartItemId || item.id || item._signature || `${item.name}-${idx}`}
                    className="mb-2"
                  >
                    <div className="flex justify-between">
                      <span>
                        {item.qty} x {item.name}
                      </span>
                      <span>
                        $
                        {(
                          Number(item.price || 0) * Number(item.qty || 1)
                        ).toFixed(2)}
                      </span>
                    </div>
                    {Array.isArray(item.details) &&
                      item.details.length > 0 && (
                        <ul className="pl-4 list-disc text-[10px] text-slate-600 mt-1">
                          {item.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      )}
                    {item.configuration &&
                      !Array.isArray(item.details) && (
                        <p className="pl-4 text-[10px] text-slate-600 mt-1">
                          {JSON.stringify(item.configuration)}
                        </p>
                      )}
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500">
                  No hay productos en el ticket.
                </p>
              )}
            </div>

            <div className="flex justify-between font-bold text-lg mt-4 mb-6">
              <span>TOTAL</span>
              <span>${ticketTotal.toFixed(2)}</span>
            </div>

            {/* 2. REEMPLAZO DEL QR EXTERNO POR LIBRERÍA LOCAL */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-2 mb-2 border border-slate-300 rounded-lg flex items-center justify-center">
                <QRCodeCanvas
                  value={qrData}
                  size={128}
                  level={"M"}
                  includeMargin={true}
                />
              </div>
              <p className="text-[10px] text-center text-slate-600">
                {currentOrderId
                  ? "Escanea para ver el detalle de la orden."
                  : "Orden temporal. Se generará un código definitivo al enviar."}
              </p>
            </div>
          </div>
        </div>

        {/* Lado derecho: acciones */}
        <div className="w-full md:w-72 bg-slate-950 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 p-6 gap-4">
          <div className="space-y-2 text-sm">
            <p className="text-slate-400 uppercase text-[10px] font-bold tracking-[0.2em]">
              Resumen
            </p>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Total a cobrar</span>
              <span className="text-lg font-black text-orange-400">
                ${ticketTotal.toFixed(2)}
              </span>
            </div>
            {orderType && (
              <p className="text-xs text-slate-500">
                Tipo:{" "}
                <span className="font-semibold text-slate-200">
                  {orderType}
                </span>
              </p>
            )}
            {customerName && (
              <p className="text-xs text-slate-500">
                Cliente:{" "}
                <span className="font-semibold text-slate-200">
                  {customerName}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            {!currentOrderId ? (
              <>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading || ticketItems.length === 0}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Enviando..." : "CONFIRMAR"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-lg border border-slate-700 transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg shadow-lg hover:bg-slate-800"
              >
                Nueva Orden
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}