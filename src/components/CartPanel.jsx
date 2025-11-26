import React, { useState, useEffect } from "react";
import {
  ShoppingCart, Trash2, Plus, Minus, User, Phone, FileText, MapPin, Utensils, ChevronDown, ChevronUp, Check, AlertCircle
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

  // Estado derivado para validación
  const isValid = orderType === "local" 
    ? true 
    : (customerName.trim() && customerPhone.trim() && customerAddress.trim());

  const handleValidateAndCheckout = () => {
    if (!isValid) {
        setIsFormCollapsed(false); // Abrir formulario para mostrar error
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

  return (
    <div className="w-full md:w-96 bg-white shadow-2xl flex flex-col h-full md:h-screen border-t md:border-t-0 md:border-l border-slate-200 z-10 relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <ShoppingCart className="text-amber-600" />
            Pedido Actual
          </h2>
          {lastOrderNumber && (
            <p className="text-xs text-green-600 font-bold mt-1">Ticket #{lastOrderNumber}</p>
          )}
        </div>
      </div>

      {/* Lista de Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <ShoppingCart size={48} className="opacity-20" />
            <p>Carrito vacío</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.cartItemId || item.id} className="flex flex-col bg-white p-3 rounded-lg border border-slate-100 shadow-sm gap-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                    <h4 className="font-medium text-sm text-slate-900 w-full truncate">{item.name}</h4>
                    {/* Detalles de configuración */}
                    <div className="text-[10px] text-slate-500 flex flex-col gap-0.5 mt-1">
                        {item.details?.map((det, i) => (
                            <span key={i} className="flex items-center gap-1">• {det}</span>
                        ))}
                        {item.ingredients?.length > 0 && (
                            <span className="italic">Ing: {item.ingredients.join(", ")}</span>
                        )}
                    </div>
                </div>
                <p className="text-sm font-bold text-slate-700 whitespace-nowrap">${(item.price * item.qty).toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                 <div className="flex items-center bg-slate-100 rounded-lg">
                    <button onClick={() => updateQty(item, -1)} className="p-1 hover:bg-slate-200 rounded-l-lg"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(item, 1)} className="p-1 hover:bg-slate-200 rounded-r-lg"><Plus size={14} /></button>
                 </div>
                 <button onClick={() => removeFromCart(item)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulario Cliente */}
      <div className={`border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 transition-all ${!isValid && orderType === 'telefono' ? 'bg-red-50' : ''}`}>
        <button 
          onClick={() => setIsFormCollapsed(!isFormCollapsed)}
          className="w-full p-3 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-100 transition-colors"
        >
            <span className="flex items-center gap-2">
                <User size={14} />
                {isFormCollapsed ? (customerName || "Datos del Cliente") : "Datos del Cliente"}
                {!isValid && orderType === 'telefono' && <AlertCircle size={14} className="text-red-500" />}
            </span>
            {isFormCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {!isFormCollapsed && (
            <div className="p-4 space-y-3">
                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                  <button onClick={() => setOrderType("local")} className={`flex-1 py-1 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${orderType === "local" ? "bg-amber-100 text-amber-800" : "text-slate-500"}`}>
                    <User size={14} /> Local
                  </button>
                  <button onClick={() => setOrderType("telefono")} className={`flex-1 py-1 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${orderType === "telefono" ? "bg-blue-100 text-blue-800" : "text-slate-500"}`}>
                    <Phone size={14} /> Teléfono
                  </button>
                </div>

                <div className="space-y-2">
                    <input type="text" placeholder="Nombre *" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      value={customerName} onChange={(e) => setCustomerName(e.target.value)} />

                    {orderType === "telefono" && (
                    <>
                        <input type="tel" placeholder="Teléfono *" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                          value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                        <input type="text" placeholder="Dirección *" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                          value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                    </>
                    )}
                    
                    <textarea placeholder="Notas..." className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none h-12 resize-none"
                        value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
                </div>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-50 border-t border-slate-200 shrink-0">
        <div className="flex justify-between mb-4 text-xl font-bold text-slate-900">
          <span>Total</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <button
          onClick={handleValidateAndCheckout}
          disabled={cart.length === 0 || loadingOrder || showTicket || (!isValid && orderType === 'telefono')}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
            cart.length === 0 || loadingOrder || (!isValid && orderType === 'telefono')
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500"
          }`}
        >
          <Utensils size={20} />
          {loadingOrder ? "Procesando..." : "Cobrar"}
        </button>
      </div>
    </div>
  );
}