import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Receipt, User, Phone, MapPin, FileText, Utensils } from 'lucide-react';

export default function CartPanel({ 
  cart, 
  cartTotal, 
  updateQty, 
  removeFromCart, 
  onCheckout,
  lastOrderNumber,
  loadingOrder
}) {
  // Estados del formulario
  const [orderType, setOrderType] = useState('local'); // 'local' | 'telefono'
  
  // Campos de datos
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState(''); // Para local: opcional. Para teléfono: deliveryNotes opcional.

  // Wrapper para checkout con validación estricta
  const handleValidationAndCheckout = () => {
    if (cart.length === 0) return;

    // Validación Pedido Telefónico
    if (orderType === 'telefono') {
      if (!customerName.trim()) return alert("Para envíos, el NOMBRE es obligatorio.");
      if (!customerPhone.trim()) return alert("Para envíos, el TELÉFONO es obligatorio.");
      if (!customerAddress.trim()) return alert("Para envíos, la DIRECCIÓN es obligatoria.");
    }

    // Preparar objeto de datos limpio
    const checkoutData = {
      orderType,
      customerName: customerName.trim() || (orderType === 'local' ? 'Cliente Local' : 'Anónimo'),
      // Para local enviamos null en estos campos si están vacíos
      phone: orderType === 'telefono' ? customerPhone : null,
      address: orderType === 'telefono' ? customerAddress : null,
      // Notas unificadas: en local es nota cocina, en telefono es nota entrega
      notes: orderNotes.trim(), 
      deliveryNotes: orderType === 'telefono' ? orderNotes.trim() : null 
    };

    onCheckout(checkoutData);
    
    // Limpiar campos después de enviar (opcional, depende de la UX deseada)
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setOrderNotes('');
    setOrderType('local');
  };

  return (
    <div className="w-96 bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 z-10 relative">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <ShoppingCart className="text-amber-600" />
            Pedido Actual
          </h2>
          {lastOrderNumber && <p className="text-xs text-green-600 font-bold mt-1">Último: #{lastOrderNumber}</p>}
        </div>
        <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">
          {cart.length} ítems
        </span>
      </div>

      {/* Lista de Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <ShoppingCart size={48} className="opacity-20" />
            <p>El carrito está vacío</p>
          </div>
        ) : (
          cart.map((item, index) => (
            // Usamos index como key fallback porque podemos tener el mismo producto con diferentes toppings
            <div key={`${item.id}-${index}`} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-slate-900 leading-tight">{item.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-1">${item.price.toFixed(2)} c/u</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-100 rounded-lg">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-200 rounded-l-lg transition"><Minus size={14} /></button>
                  <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-slate-200 rounded-r-lg transition"><Plus size={14} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulario de Pedido */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        
        {/* Switch Tipo de Pedido */}
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
          <button 
            onClick={() => setOrderType('local')} 
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${orderType === 'local' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Utensils size={16} /> Local
          </button>
          <button 
            onClick={() => setOrderType('telefono')} 
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${orderType === 'telefono' ? 'bg-blue-100 text-blue-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Phone size={16} /> Teléfono
          </button>
        </div>

        {/* Campos Dinámicos */}
        <div className="space-y-2 animate-fadeIn">
          
          {/* Nombre: Opcional en local, Obligatorio en teléfono */}
          <div className="relative">
            <User className={`absolute left-3 top-2.5 size={16} ${orderType === 'telefono' && !customerName ? 'text-red-400' : 'text-slate-400'}`} />
            <input 
              type="text"
              placeholder={orderType === 'telefono' ? "Nombre Cliente (Requerido)" : "Nombre Cliente (Opcional)"}
              className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                orderType === 'telefono' && !customerName ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
              }`}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {/* Campos EXCLUSIVOS para Teléfono */}
          {orderType === 'telefono' && (
            <>
              <div className="relative animate-fadeIn">
                <Phone className={`absolute left-3 top-2.5 size={16} ${!customerPhone ? 'text-red-400' : 'text-slate-400'}`} />
                <input 
                  type="tel"
                  placeholder="Número de Teléfono (Requerido)"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    !customerPhone ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                  }`}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="relative animate-fadeIn">
                <MapPin className={`absolute left-3 top-2.5 size={16} ${!customerAddress ? 'text-red-400' : 'text-slate-400'}`} />
                <textarea 
                  placeholder="Dirección de Entrega (Requerido)"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none transition-colors ${
                    !customerAddress ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                  }`}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Notas: Cocina (Local) o Referencia (Teléfono) */}
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <textarea 
              placeholder={orderType === 'telefono' ? "Referencias (Casa verde, portón negro...)" : "Notas para cocina (Sin cebolla...)"}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 h-14 resize-none bg-white"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* Footer / Totales */}
      <div className="p-6 bg-slate-50 border-t border-slate-200">
        <div className="flex justify-between mb-6 text-xl font-bold text-slate-900">
          <span>Total</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={handleValidationAndCheckout}
          disabled={cart.length === 0 || loadingOrder}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
            cart.length === 0 || loadingOrder
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 shadow-green-200'
          }`}
        >
          <Receipt size={20} />
          {loadingOrder ? 'Procesando...' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}