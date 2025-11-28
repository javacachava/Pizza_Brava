import React, { useState } from "react";
import { toast } from "react-hot-toast";
import {
  ShoppingCart, Trash2, Plus, Minus, User, Phone, FileText, MapPin, ChevronDown, ChevronUp, Check, AlertCircle, CreditCard
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
        if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
            toast.error("Faltan datos de entrega", { duration: 4000 });
            setIsFormCollapsed(false);
            return;
        }
    }
    onCheckout({ orderType, customerName, customerPhone, customerAddress, orderNotes });
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-900 border-l border-slate-800">
      
      {/* Header Carrito */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm flex justify-between items-center shrink-0 z-20">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
            <ShoppingCart size={20} className="text-orange-500" /> Pedido Actual
          </h2>
          {lastOrderNumber && (
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase">
              <Check size={10}/> Anterior: #{lastOrderNumber}
            </div>
          )}
        </div>
        <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold px-3 py-1 rounded-full">
            {cart.reduce((acc, i) => acc + i.qty, 0)} Ítems
        </span>
      </div>

      {/* Lista de Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 select-none">
            <div className="bg-slate-800/50 p-6 rounded-full border border-slate-800">
                <ShoppingCart size={48} className="opacity-30" />
            </div>
            <p className="font-medium text-sm tracking-wider uppercase">Carrito Vacío</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.cartItemId || item.id} className="relative group bg-slate-800 p-4 rounded-xl border border-slate-700/50 hover:border-orange-500/30 transition-all">
              <div className="flex justify-between items-start gap-3">
                {/* Controles Cantidad */}
                <div className="flex flex-col items-center gap-1 bg-slate-900 rounded-lg border border-slate-700 p-1 shrink-0">
                    <button onClick={() => updateQty(item, 1)} className="p-1 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"><Plus size={12} /></button>
                    <span className="font-black text-white text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item, -1)} className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Minus size={12} /></button>
                </div>

                {/* Detalles */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-200 leading-tight text-sm">{item.name}</h4>
                    <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                        {item.details?.map((det, i) => <p key={i} className="truncate flex items-center gap-1 text-slate-400"><span className="w-1 h-1 bg-slate-500 rounded-full"></span> {det}</p>)}
                        {item.ingredients?.length > 0 && <p className="italic text-orange-400/80 truncate">+ {item.ingredients.join(", ")}</p>}
                    </div>
                </div>

                {/* Precio y Eliminar */}
                <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-white">${(item.price * item.qty).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item)} className="text-slate-500 hover:text-red-400 transition-colors p-1 hover:bg-slate-700 rounded">
                        <Trash2 size={14} />
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulario Cliente */}
      <div className={`border-t border-slate-800 bg-slate-900 z-20 transition-colors duration-300 ${!isValidPhoneOrder && orderType === 'telefono' ? 'bg-red-900/10' : ''}`}>
        <button 
          onClick={() => setIsFormCollapsed(!isFormCollapsed)}
          className="w-full p-4 flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-800/50 transition-colors border-b border-slate-800"
        >
            <span className="flex items-center gap-2">
                <User size={14} />
                {isFormCollapsed 
                  ? (customerName ? `${customerName} (${orderType})` : "DATOS CLIENTE") 
                  : "INFORMACIÓN ENTREGA"}
                {!isValidPhoneOrder && orderType === 'telefono' && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
            </span>
            {isFormCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {!isFormCollapsed && (
            <div className="p-5 space-y-4 bg-slate-900">
                {/* Tabs Tipo Orden */}
                <div className="flex bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setOrderType("local")} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${orderType === "local" ? "bg-slate-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>
                    Local
                  </button>
                  <button onClick={() => setOrderType("telefono")} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${orderType === "telefono" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>
                    Teléfono
                  </button>
                </div>

                <div className="space-y-3">
                    <div className="relative group">
                        <User className="absolute left-3 top-3 text-slate-500 group-focus-within:text-orange-500" size={16}/>
                        <input type="text" placeholder="Nombre Cliente" className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-slate-900 focus:border-transparent text-white outline-none transition-all placeholder-slate-600"
                          value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    </div>

                    {orderType === "telefono" && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="relative group">
                            <Phone className="absolute left-3 top-3 text-slate-500 group-focus-within:text-orange-500" size={16}/>
                            <input type="tel" placeholder="Teléfono" className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white outline-none transition-all placeholder-slate-600"
                              value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                        </div>
                        <div className="relative group">
                            <MapPin className="absolute left-3 top-3 text-slate-500 group-focus-within:text-orange-500" size={16}/>
                            <input type="text" placeholder="Dirección Entrega" className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white outline-none transition-all placeholder-slate-600"
                              value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                        </div>
                    </div>
                    )}
                    
                    <div className="relative group">
                        <FileText className="absolute left-3 top-3 text-slate-500 group-focus-within:text-orange-500" size={16}/>
                        <textarea placeholder="Notas (sin cebolla...)" className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white outline-none h-20 resize-none transition-all placeholder-slate-600"
                            value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
                    </div>
                    
                    <button 
                        onClick={() => setIsFormCollapsed(true)}
                        className="w-full py-3 bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-700 hover:text-white flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    >
                        <Check size={16}/> Ocultar Datos
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Footer Total */}
      <div className="p-6 bg-slate-950 border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] shrink-0 z-30">
        <div className="flex justify-between mb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
          <span>Subtotal</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-6 items-end">
          <span className="text-xl font-black text-white">TOTAL</span>
          <span className="text-4xl font-black tracking-tight text-orange-500">${cartTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={handleValidateAndCheckout}
          disabled={cart.length === 0 || loadingOrder || showTicket}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
            cart.length === 0 || loadingOrder
              ? "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none border border-slate-700"
              : "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 shadow-orange-900/40"
          }`}
        >
          {loadingOrder ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
              <>
                <CreditCard size={22} /> CONFIRMAR
              </>
          )}
        </button>
      </div>
    </div>
  );
}