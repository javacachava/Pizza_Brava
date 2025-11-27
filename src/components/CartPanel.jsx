import React, { useState } from "react";
import { toast } from "react-hot-toast";
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

  // Estado para colapsar/expandir el formulario
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  // Validación visual
  const isValidPhoneOrder = orderType === 'local' || (customerName.trim() && customerPhone.trim() && customerAddress.trim());

  const handleValidateAndCheckout = () => {
    // 1. Validar Carrito
    if (cart.length === 0) {
        toast.error("El carrito está vacío", { icon: '🛒' });
        return;
    }

    // 2. Validar Datos de Cliente (Solo para teléfono)
    if (orderType === "telefono") {
        let missing = [];
        if (!customerName.trim()) missing.push("Nombre");
        if (!customerPhone.trim()) missing.push("Teléfono");
        if (!customerAddress.trim()) missing.push("Dirección");

        if (missing.length > 0) {
            toast.error(`Faltan datos: ${missing.join(", ")}`, { duration: 4000 });
            setIsFormCollapsed(false); // Abrir formulario automáticamente
            return;
        }
    }
    
    // 3. Proceder
    onCheckout({
      orderType,
      customerName,
      customerPhone,
      customerAddress,
      orderNotes
    });
  };

  return (
    <div className="w-full md:w-96 bg-white flex flex-col h-full md:h-screen relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <ShoppingCart className="text-amber-600" />
            Pedido Actual
          </h2>
          {lastOrderNumber && (
            <p className="text-xs text-green-600 font-bold mt-1">
              Ticket Anterior: #{lastOrderNumber}
            </p>
          )}
        </div>
      </div>

      {/* Lista de Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <ShoppingCart size={48} className="opacity-20" />
            <p>Agrega productos del menú</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.cartItemId || item.id} className="flex flex-col bg-white p-3 rounded-lg border border-slate-200 shadow-sm gap-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-2 overflow-hidden">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{item.name}</h4>
                    {/* Detalles del item (Ingredientes, Combo, etc) */}
                    <div className="text-[11px] text-slate-500 flex flex-col gap-0.5 mt-1 leading-tight">
                        {item.details?.map((det, i) => (
                            <span key={i} className="flex items-center gap-1">• {det}</span>
                        ))}
                        {item.ingredients?.length > 0 && (
                            <span className="italic text-slate-400">Ing: {item.ingredients.join(", ")}</span>
                        )}
                    </div>
                </div>
                <p className="text-sm font-bold text-slate-900 whitespace-nowrap">
                  ${(item.price * item.qty).toFixed(2)}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                 <p className="text-xs text-slate-400 font-mono">${item.price.toFixed(2)} c/u</p>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200">
                      <button onClick={() => updateQty(item, -1)} className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-l-lg active:bg-slate-300">
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-slate-800">{item.qty}</span>
                      <button onClick={() => updateQty(item, 1)} className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-r-lg active:bg-slate-300">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors">
                      <Trash2 size={16} />
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulario Cliente (Acordeón) */}
      <div className={`border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 transition-colors duration-300 ${!isValidPhoneOrder && orderType === 'telefono' ? 'bg-red-50' : ''}`}>
        <button 
          onClick={() => setIsFormCollapsed(!isFormCollapsed)}
          className="w-full p-3 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-black/5 transition-colors"
        >
            <span className="flex items-center gap-2">
                <User size={14} />
                {isFormCollapsed 
                  ? (customerName ? `${customerName} (${orderType})` : "Datos del Cliente") 
                  : "Información de Entrega"}
                {!isValidPhoneOrder && orderType === 'telefono' && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
            </span>
            {isFormCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {!isFormCollapsed && (
            <div className="p-4 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                {/* Selector Tipo Orden */}
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button onClick={() => setOrderType("local")} className={`flex-1 py-1.5 text-sm font-bold rounded shadow-sm transition-all ${orderType === "local" ? "bg-white text-slate-800" : "text-slate-400 hover:text-slate-600"}`}>
                    Local
                  </button>
                  <button onClick={() => setOrderType("telefono")} className={`flex-1 py-1.5 text-sm font-bold rounded shadow-sm transition-all ${orderType === "telefono" ? "bg-white text-blue-600" : "text-slate-400 hover:text-slate-600"}`}>
                    Teléfono
                  </button>
                </div>

                <div className="space-y-2">
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input type="text" placeholder="Nombre del Cliente" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none"
                          value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    </div>

                    {orderType === "telefono" && (
                    <div className="space-y-2">
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                            <input type="tel" placeholder="Teléfono" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none"
                              value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                            <input type="text" placeholder="Dirección Exacta" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none"
                              value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                        </div>
                    </div>
                    )}
                    
                    <div className="relative">
                        <FileText className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <textarea placeholder="Notas (sin cebolla, extra salsa...)" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none h-16 resize-none bg-white"
                            value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
                    </div>
                    
                    <button 
                        onClick={() => setIsFormCollapsed(true)}
                        className="w-full py-2 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors"
                    >
                        <Check size={14}/> Listo
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Footer Total */}
      <div className="p-6 bg-slate-50 border-t border-slate-200 shrink-0">
        <div className="flex justify-between mb-4">
          <span className="text-lg font-medium text-slate-500">Total</span>
          <span className="text-2xl font-black text-slate-900">${cartTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={handleValidateAndCheckout}
          disabled={cart.length === 0 || loadingOrder || showTicket}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
            cart.length === 0 || loadingOrder
              ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-red-200"
          }`}
        >
          <Utensils size={20} />
          {loadingOrder ? "Procesando..." : "COBRAR"}
        </button>
      </div>
    </div>
  );
}