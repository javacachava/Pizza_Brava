import React, { useState } from "react";
import { toast } from "react-hot-toast";
import {
  ShoppingCart, Trash2, Plus, Minus, User, Phone, FileText, MapPin, Utensils, ChevronDown, ChevronUp, Check, AlertCircle, CreditCard
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
  const [orderType, setOrderType] = useState("local");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  const isValidPhoneOrder = orderType === 'local' || (customerName.trim() && customerPhone.trim() && customerAddress.trim());

  const handleValidateAndCheckout = () => {
    if (cart.length === 0) {
        toast.error("El carrito está vacío", { icon: '🛒' });
        return;
    }
    if (orderType === "telefono") {
        let missing = [];
        if (!customerName.trim()) missing.push("Nombre");
        if (!customerPhone.trim()) missing.push("Teléfono");
        if (!customerAddress.trim()) missing.push("Dirección");

        if (missing.length > 0) {
            toast.error(`Faltan datos: ${missing.join(", ")}`, { duration: 4000 });
            setIsFormCollapsed(false);
            return;
        }
    }
    onCheckout({
      orderType, customerName, customerPhone, customerAddress, orderNotes
    });
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-white">
      {/* Encabezado Ticket */}
      <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 z-20 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <ShoppingCart size={20} className="text-orange-600" /> Orden Actual
          </h2>
          {lastOrderNumber && (
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">
              <Check size={10}/> Anterior: #{lastOrderNumber}
            </div>
          )}
        </div>
        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
            {cart.reduce((acc, i) => acc + i.qty, 0)} Ítems
        </span>
      </div>

      {/* Lista de Items (Estilo Ticket) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 select-none">
            <div className="bg-slate-100 p-6 rounded-full">
                <ShoppingCart size={48} className="opacity-40" />
            </div>
            <p className="font-medium">El carrito está vacío</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.cartItemId || item.id} className="relative group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-orange-200 hover:shadow-md transition-all">
              <div className="flex justify-between items-start gap-3">
                
                {/* Cantidad */}
                <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-lg border border-slate-200 p-1 shrink-0">
                    <button onClick={() => updateQty(item, 1)} className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"><Plus size={12} /></button>
                    <span className="font-black text-slate-800 text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item, -1)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Minus size={12} /></button>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 leading-tight">{item.name}</h4>
                    <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                        {item.details?.map((det, i) => <p key={i} className="truncate flex items-center gap-1"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> {det}</p>)}
                        {item.ingredients?.length > 0 && <p className="italic text-slate-400 truncate">+ {item.ingredients.join(", ")}</p>}
                    </div>
                </div>

                {/* Precio y Borrar */}
                <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-slate-900">${(item.price * item.qty).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Panel de Cliente (Acordeón Estilizado) */}
      <div className={`border-t border-slate-200 bg-white z-20 transition-colors duration-300 ${!isValidPhoneOrder && orderType === 'telefono' ? 'bg-red-50/50' : ''}`}>
        <button 
          onClick={() => setIsFormCollapsed(!isFormCollapsed)}
          className="w-full p-4 flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-colors border-b border-slate-100"
        >
            <span className="flex items-center gap-2">
                <User size={16} />
                {isFormCollapsed 
                  ? (customerName ? `${customerName} (${orderType})` : "DATOS DEL CLIENTE") 
                  : "INFORMACIÓN DE ENTREGA"}
                {!isValidPhoneOrder && orderType === 'telefono' && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
            </span>
            {isFormCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {!isFormCollapsed && (
            <div className="p-5 space-y-4 bg-white">
                {/* Selector Tipo Orden */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setOrderType("local")} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${orderType === "local" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                    En Local
                  </button>
                  <button onClick={() => setOrderType("telefono")} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${orderType === "telefono" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                    Teléfono
                  </button>
                </div>

                <div className="space-y-3">
                    <div className="relative group">
                        <User className="absolute left-3 top-3 text-slate-400 group-focus-within:text-orange-500" size={16}/>
                        <input type="text" placeholder="Nombre del Cliente" className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent outline-none transition-all font-medium"
                          value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    </div>

                    {orderType === "telefono" && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="relative group">
                            <Phone className="absolute left-3 top-3 text-slate-400 group-focus-within:text-orange-500" size={16}/>
                            <input type="tel" placeholder="Teléfono" className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
                              value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                        </div>
                        <div className="relative group">
                            <MapPin className="absolute left-3 top-3 text-slate-400 group-focus-within:text-orange-500" size={16}/>
                            <input type="text" placeholder="Dirección de Entrega" className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
                              value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                        </div>
                    </div>
                    )}
                    
                    <div className="relative group">
                        <FileText className="absolute left-3 top-3 text-slate-400 group-focus-within:text-orange-500" size={16}/>
                        <textarea placeholder="Notas (sin cebolla, extra salsa...)" className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none h-20 resize-none transition-all"
                            value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
                    </div>
                    
                    <button 
                        onClick={() => setIsFormCollapsed(true)}
                        className="w-full py-3 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Check size={16}/> Guardar Datos
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Footer Total - Estilo oscuro para contraste */}
      <div className="p-6 bg-slate-900 text-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] shrink-0 z-30">
        <div className="flex justify-between mb-2 text-slate-400 text-sm font-medium">
          <span>Subtotal</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-6 items-end">
          <span className="text-xl font-bold">Total</span>
          <span className="text-4xl font-black tracking-tight text-orange-500">${cartTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={handleValidateAndCheckout}
          disabled={cart.length === 0 || loadingOrder || showTicket}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
            cart.length === 0 || loadingOrder
              ? "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 shadow-orange-900/50"
          }`}
        >
          {loadingOrder ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
              <>
                <CreditCard size={22} /> CONFIRMAR ORDEN
              </>
          )}
        </button>
      </div>
    </div>
  );
}