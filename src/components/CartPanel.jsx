import React, { useState } from "react";
import { toast } from "react-hot-toast";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  Phone,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  CreditCard
} from "lucide-react";

export default function CartPanel({
  cart,
  cartTotal,
  updateQty,
  removeFromCart,
  onCheckout,
  showTicket,
  lastOrderNumber,
  loadingOrder
}) {
  const [orderType, setOrderType] = useState("local"); // "local" | "telefono"
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  const isPhoneOrder = orderType === "telefono";
  const hasCustomerData =
    customerName.trim() && customerPhone.trim() && customerAddress.trim();

  const canConfirm =
    cart.length > 0 &&
    !loadingOrder &&
    !showTicket &&
    (!isPhoneOrder || hasCustomerData);

  const handleValidateAndCheckout = () => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío", { icon: "🛒" });
      return;
    }

    if (isPhoneOrder && !hasCustomerData) {
      toast.error("Faltan datos de entrega (nombre, teléfono y dirección).", {
        duration: 4000,
        icon: <AlertCircle size={18} />
      });
      setIsFormCollapsed(false);
      return;
    }

    onCheckout({
      orderType,
      customerName,
      customerPhone,
      customerAddress,
      orderNotes
    });
  };

  const totalItems = cart.reduce((acc, item) => acc + (item.qty || 0), 0);

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-900 border-l border-slate-800">
      {/* HEADER CARRITO */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm flex justify-between items-center shrink-0 z-20">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
            <ShoppingCart size={20} className="text-orange-500" />
            Pedido Actual
          </h2>
          {lastOrderNumber && (
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold uppercase">
              <Check size={10} />
              Anterior: #{lastOrderNumber}
            </div>
          )}
        </div>
        <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold px-3 py-1 rounded-full">
          {totalItems} ítem(s)
        </span>
      </div>

      {/* LISTA DE ITEMS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 select-none">
            <div className="bg-slate-800/50 p-6 rounded-full border border-slate-800">
              <ShoppingCart size={48} className="opacity-30" />
            </div>
            <p className="font-medium text-sm tracking-wider uppercase">
              Carrito vacío
            </p>
            <p className="text-xs text-slate-500">
              Agrega productos desde el panel de menú.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const lineTotal = Number(item.price || 0) * (item.qty || 0);
            const details = item.details || [];

            return (
              <div
                key={item.cartItemId || item.id}
                className="relative bg-slate-900 rounded-2xl border border-slate-700/50 hover:border-orange-500/40 transition-all p-3 flex gap-3"
              >
                {/* Controles de cantidad */}
                <div className="flex flex-col items-center gap-1 bg-slate-900 rounded-lg border border-slate-700 p-1 shrink-0">
                  <button
                    onClick={() => updateQty(item, 1)}
                    className="w-6 h-6 flex items-center justify-center text-xs text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                  <span className="font-black text-white text-sm">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item, -1)}
                    className="w-6 h-6 flex items-center justify-center text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                </div>

                {/* Detalles del item */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-50 truncate">
                        {item.name}
                      </p>
                      {item.mainCategory && (
                        <p className="text-[10px] uppercase text-slate-500 mt-0.5">
                          {item.mainCategory}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item)}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full p-1 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {details.length > 0 && (
                    <div className="mt-1 text-[11px] text-slate-400 space-y-0.5 max-h-20 overflow-y-auto">
                      {details.map((d, idx) => (
                        <p key={idx} className="truncate">
                          • {d}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">
                      ${Number(item.price || 0).toFixed(2)} c/u
                    </span>
                    <span className="font-mono font-bold text-orange-400 text-sm">
                      ${lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PANEL INFERIOR: DATOS DEL PEDIDO */}
      <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-4">
        {/* TOTAL */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <AlertCircle size={14} />
            <span>
              Revisa los datos antes de enviar la orden a cocina.
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase text-slate-500">Total</p>
            <p className="text-xl font-black text-orange-400 font-mono">
              ${cartTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* ORDEN Y CLIENTE */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl">
          {/* Toggle collapse */}
          <button
            type="button"
            onClick={() => setIsFormCollapsed((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs text-slate-300"
          >
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-400" />
              <span className="font-semibold uppercase tracking-wide">
                Datos del cliente y del pedido
              </span>
            </div>
            {isFormCollapsed ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronUp size={16} />
            )}
          </button>

          {!isFormCollapsed && (
            <div className="p-3 space-y-3">
              {/* Tipo de orden */}
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-2">
                  Tipo de orden
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType("local")}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      orderType === "local"
                        ? "bg-orange-500 text-white border-orange-400"
                        : "bg-slate-900 text-slate-300 border-slate-700 hover:border-orange-400"
                    }`}
                  >
                    En local
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("telefono")}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      orderType === "telefono"
                        ? "bg-orange-500 text-white border-orange-400"
                        : "bg-slate-900 text-slate-300 border-slate-700 hover:border-orange-400"
                    }`}
                  >
                    Teléfono / domicilio
                  </button>
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                  <User size={12} />
                  Nombre del cliente
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={
                      orderType === "local"
                        ? "Opcional (Mostrador)"
                        : "Obligatorio para teléfono"
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                  <Phone size={12} />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={
                    orderType === "local"
                      ? "Opcional"
                      : "Obligatorio para teléfono"
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Dirección (solo teléfono) */}
              {isPhoneOrder && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                    <MapPin size={12} />
                    Dirección
                  </label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Dirección completa para entrega"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500 resize-none min-h-[60px]"
                  />
                </div>
              )}

              {/* Notas */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                  <FileText size={12} />
                  Notas de la orden
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Sin cebolla, extra queso, referencia de mesa, etc."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500 resize-none min-h-[60px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* BOTÓN CONFIRMAR */}
        <button
          type="button"
          onClick={handleValidateAndCheckout}
          disabled={!canConfirm}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black tracking-wide uppercase transition-all border ${
            !canConfirm
              ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-600 to-red-600 text-white border-transparent hover:from-orange-500 hover:to-red-500 shadow-lg shadow-orange-900/40 hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {loadingOrder ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CreditCard size={18} />
              Confirmar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
