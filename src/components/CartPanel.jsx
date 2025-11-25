import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Receipt, User, Phone, FileText, Sparkles, Loader, X } from 'lucide-react';
import { standardizeNotesService, suggestUpsellService } from '../services/gemini';

export default function CartPanel({ 
  cart, 
  cartTotal, 
  updateQty, 
  removeFromCart, 
  onAddToCart, // Para el upsell
  onCheckout,
  showTicket,
  menuItems,
  lastOrderNumber,
  loadingOrder
}) {
  // Estados locales del formulario
  const [orderType, setOrderType] = useState('local');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Estados locales de IA
  const [aiUpsellLoading, setAiUpsellLoading] = useState(false);
  const [aiNotesLoading, setAiNotesLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Wrappers para llamar al servicio de IA
  const handleStandardizeNotes = async () => {
    setAiNotesLoading(true);
    const result = await standardizeNotesService(orderNotes);
    if (result) setOrderNotes(result);
    setAiNotesLoading(false);
  };

  const handleSuggestUpsell = async () => {
    setAiUpsellLoading(true);
    const suggestion = await suggestUpsellService(cart, menuItems);
    if (suggestion) {
      const product = menuItems.find(i => i.id === suggestion.recommendedItemId);
      if (product) setAiSuggestion({ ...product, reason: suggestion.reason });
    }
    setAiUpsellLoading(false);
  };

  // Wrapper para checkout que envía los datos del form
  const triggerCheckout = () => {
    onCheckout({ orderType, customerName, orderNotes });
  };

  return (
    <div className="w-96 bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 z-10 relative">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <ShoppingCart className="text-amber-600" />
            Pedido
          </h2>
          {lastOrderNumber && <p className="text-xs text-green-600 font-bold mt-1">Último: #{lastOrderNumber}</p>}
        </div>
        
        {/* Botón Upsell */}
        {cart.length > 0 && menuItems.length > 0 && !aiSuggestion && (
          <button 
            onClick={handleSuggestUpsell}
            disabled={aiUpsellLoading}
            className="text-xs flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all animate-pulse"
          >
            {aiUpsellLoading ? <Loader size={12} className="animate-spin"/> : <Sparkles size={12} />}
            Sugerir Extra
          </button>
        )}
      </div>

      {/* Sugerencia AI */}
      {aiSuggestion && (
        <div className="bg-indigo-50 p-3 border-b border-indigo-100 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg border border-indigo-100"><Sparkles size={16} className="text-indigo-500" /></div>
            <div className="flex-1">
              <p className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Gemini Sugiere:</p>
              <p className="text-sm font-medium text-slate-800">{aiSuggestion.name}</p>
              <p className="text-xs text-slate-500 italic mb-2">"{aiSuggestion.reason}"</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { onAddToCart(aiSuggestion); setAiSuggestion(null); }}
                  className="flex-1 bg-indigo-600 text-white text-xs font-bold py-1.5 rounded hover:bg-indigo-700 transition"
                >
                  Agregar (+${aiSuggestion.price})
                </button>
                <button onClick={() => setAiSuggestion(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <ShoppingCart size={48} className="opacity-20" />
            <p>Carrito vacío</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-slate-900">{item.name}</h4>
                <p className="text-xs text-slate-500">${item.price.toFixed(2)} c/u</p>
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

      {/* Formulario */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
          <button onClick={() => setOrderType('local')} className={`flex-1 py-1 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${orderType === 'local' ? 'bg-amber-100 text-amber-800' : 'text-slate-500'}`}><User size={14} /> Local</button>
          <button onClick={() => setOrderType('telefono')} className={`flex-1 py-1 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${orderType === 'telefono' ? 'bg-blue-100 text-blue-800' : 'text-slate-500'}`}><Phone size={14} /> Teléfono</button>
        </div>

        <input 
          type="text"
          placeholder="Nombre del Cliente"
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none ${orderType === 'telefono' && !customerName ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        <div className="relative group">
          <FileText className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <textarea 
            placeholder="Notas (ej: sin cebolla...)"
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none h-16 resize-none bg-white transition-colors"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
          />
          {orderNotes.length > 3 && (
            <button 
              onClick={handleStandardizeNotes}
              disabled={aiNotesLoading}
              title="Estandarizar nota con IA"
              className="absolute right-2 top-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors"
            >
              {aiNotesLoading ? <Loader size={14} className="animate-spin"/> : <Sparkles size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Footer / Totales */}
      <div className="p-6 bg-slate-50 border-t border-slate-200">
        <div className="flex justify-between mb-6 text-xl font-bold text-slate-900">
          <span>Total</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={triggerCheckout}
          disabled={cart.length === 0 || loadingOrder || showTicket}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
            cart.length === 0 || loadingOrder
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-red-200'
          }`}
        >
          <Utensils size={20} />
          {loadingOrder ? 'Procesando...' : 'Cobrar'}
        </button>
      </div>
    </div>
  );
}