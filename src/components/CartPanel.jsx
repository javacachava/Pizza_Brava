// src/components/CartPanel.jsx
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
  CreditCard,
  AlertCircle
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
  // --- ESTADO INTERNO (Lógica mantenida) ---
  const [orderType, setOrderType] = useState("local"); 
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isFormCollapsed, setIsFormCollapsed] = useState(true); // Colapsado por defecto para ver mejor los productos

  const isPhoneOrder = orderType === "telefono";
  const hasCustomerData = customerName.trim() && customerPhone.trim() && customerAddress.trim();

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
      toast.error("Faltan datos de entrega.", { icon: <AlertCircle size={18} /> });
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
    <div className="w-full h-full flex flex-col bg-slate-900 relative border-l border-slate-800">
      
      {/* HEADER DEL CARRITO */}
      <div className="p-5 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0 shadow-sm z-20">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
            <ShoppingCart className="text-orange-500" size={24} />
            PEDIDO
          </h2>
          {lastOrderNumber && (
             <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1">
                Último: #{lastOrderNumber}
             </span>
          )}
        </div>
        <span className="bg-slate-800 text-slate-300 text-sm font-bold px-3 py-1.5 rounded-xl border border-slate-700">
          {totalItems} ítems
        </span>
      </div>

      {/* LISTA DE PRODUCTOS (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50 select-none">
            <div className="p-6 bg-slate-800/50 rounded-full">
                <ShoppingCart size={48} strokeWidth={1.5} />
            </div>
            <p className="text-lg font-medium">Carrito Vacío</p>
          </div>
        ) : (
          cart.map((item, index) => {
            const lineTotal = Number(item.price || 0) * (item.qty || 0);
            
            return (
              <div
                key={item.cartItemId || index}
                className="relative bg-slate-950 rounded-2xl border border-slate-800 p-3 flex gap-4 shadow-sm group"
              >
                {/* Controles de Cantidad (Grandes) */}
                <div className="flex flex-col items-center justify-between bg-slate-900 rounded-xl border border-slate-800 w-12 shrink-0 overflow-hidden">
                  <button
                    onClick={() => updateQty(item, 1)}
                    className="w-full h-10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                  <span className="font-black text-white text-base py-0.5">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item, -1)}
                    className="w-full h-10 flex items-center justify-center text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                  >
                    <Minus size={20} strokeWidth={3} />
                  </button>
                </div>

                {/* Info Producto */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-base font-bold text-slate-100 leading-tight">{item.name}</p>
                    <button
                      onClick={() => removeFromCart(item)}
                      className="text-slate-600 hover:text-red-400 p-2 -mr-2 -mt-2 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {item.details && item.details.length > 0 && (
                    <div className="mt-1.5 text-xs text-slate-400 space-y-0.5 max-h-16 overflow-y-auto">
                      {item.details.map((d, idx) => (
                        <p key={idx} className="truncate">• {d}</p>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex justify-between items-end">
                    <span className="text-xs text-slate-500 font-medium">
                      ${Number(item.price).toFixed(2)} u.
                    </span>
                    <span className="font-mono font-black text-orange-400 text-lg">
                      ${lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ZONA INFERIOR (Formulario + Total + Botón) */}
      <div className="bg-slate-950 border-t border-slate-800 p-4 z-20 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        
        {/* Acordeón de Datos Cliente */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <button
                type="button"
                onClick={() => setIsFormCollapsed(!isFormCollapsed)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-300 bg-slate-900 hover:bg-slate-800/80 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <User size={16} className="text-orange-500" />
                    {isPhoneOrder ? "Pedido Telefónico" : "Pedido en Local"}
                </span>
                {isFormCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {!isFormCollapsed && (
                <div className="p-4 space-y-3 border-t border-slate-800 bg-slate-950/50 animate-in slide-in-from-top-2 duration-200">
                    {/* Selector Tipo */}
                    <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                        <button onClick={() => setOrderType("local")} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${orderType === "local" ? "bg-orange-500 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>EN LOCAL</button>
                        <button onClick={() => setOrderType("telefono")} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${orderType === "telefono" ? "bg-orange-500 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>TELÉFONO</button>
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <User size={14} className="absolute left-3 top-3 text-slate-500"/>
                            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nombre del cliente" className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-colors" />
                        </div>
                        
                        {orderType === "telefono" && (
                            <>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-3 text-slate-500"/>
                                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Número de teléfono" className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-colors" />
                                </div>
                                <div className="relative">
                                    <MapPin size={14} className="absolute left-3 top-3 text-slate-500"/>
                                    <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Dirección de entrega" rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 resize-none transition-colors" />
                                </div>
                            </>
                        )}

                        <div className="relative">
                             <FileText size={14} className="absolute left-3 top-3 text-slate-500"/>
                             <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder="Notas de cocina (ej. sin cebolla)" rows={1} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 resize-none transition-colors" />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* BOTÓN COBRAR Y TOTAL */}
        <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
                <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                    ${cartTotal.toFixed(2)}
                </span>
            </div>

            <button
                type="button"
                onClick={handleValidateAndCheckout}
                disabled={!canConfirm}
                className={`flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-black text-lg uppercase tracking-wide shadow-lg transition-all active:scale-95 ${
                    canConfirm 
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-orange-900/40 hover:brightness-110" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
            >
                {loadingOrder ? (
                     <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                     <>
                        <span>Cobrar</span>
                        <CreditCard size={22} />
                     </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
}