import React, { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { LogOut, History } from "lucide-react";
import { useMenu } from "../hooks/useMenu";
import { useCart } from "../hooks/useCart";
import { useOrders } from "../hooks/useOrders";
import { useConfig } from "../hooks/useConfig";
import MenuPanel from "./MenuPanel";
import CartPanel from "./CartPanel";
import TicketModal from "./TicketModal";
import ProductOptionsModal from "./ProductOptionsModal";
import OrdersHistoryModal from "./OrdersHistoryModal";

export default function ReceptionPanel({ onLogout }) {
  const { menuItems } = useMenu();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { saveOrder, loading: loadingOrder } = useOrders();
  const { config, loadingConfig } = useConfig();

  const [showTicket, setShowTicket] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState({ orderId: null, orderNumber: null, items: [] });

  if (loadingConfig) return <div className="h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-400 animate-pulse text-xl">Cargando Sistema...</div>;

  const handleProductClick = (product) => {
    const isClassic = product.pizzaType === "Clasica" || product.name.toLowerCase().includes("clásica");
    const isCombo = product.comboOptions && (product.comboOptions.hasDrink || product.comboOptions.hasSide);
    const isSpecialty = product.mainCategory === "Pizzas" && !isClassic; 
    if (isClassic || isCombo || isSpecialty) {
      setSelectedProduct(product); setShowProductModal(true);
    } else {
      addToCart(product); toast.success("Producto agregado");
    }
  };

  const handleCheckout = (formData) => {
    setPendingOrderData(formData);
    setTicketInfo({ orderId: null, orderNumber: null, items: [...cart] });
    setShowTicket(true);
  };

  const handleConfirmOrder = async () => {
    if (!pendingOrderData || loadingOrder) return;
    const toastId = toast.loading("Enviando orden a cocina...");
    try {
      const orderPayload = {
        ...pendingOrderData,
        total: Number(cartTotal.toFixed(2)),
        subtotal: Number(cartTotal.toFixed(2)),
        customerName: pendingOrderData.customerName || "Cliente Mostrador"
      };
      const { number, id } = await saveOrder({ orderData: orderPayload, cartItems: cart });
      setTicketInfo(prev => ({ ...prev, orderId: id, orderNumber: number }));
      toast.success(`Orden #${number} enviada con éxito`, { id: toastId });
      clearCart();
    } catch (error) { toast.error("Error al guardar", { id: toastId }); }
  };

  const handleReprint = (order) => {
    setPendingOrderData({
        customerName: order.customerName, orderType: order.orderType,
        customerPhone: order.customerPhone, customerAddress: order.customerAddress, orderNotes: order.orderNotes
    });
    setTicketInfo({ orderId: order.id, orderNumber: order.number, items: order.itemsSnapshot || [] });
    setShowTicket(true); setShowHistory(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      {/* Botones flotantes superiores */}
      <div className="absolute top-5 right-6 z-50 flex gap-3">
        <button 
            onClick={() => setShowHistory(true)} 
            className="bg-white/90 backdrop-blur text-slate-700 p-3 rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all border border-slate-200 group" 
            title="Historial"
        >
            <History size={20} className="group-hover:text-blue-600 transition-colors" />
        </button>
        <button 
            onClick={onLogout} 
            className="bg-red-500/90 backdrop-blur text-white p-3 rounded-full shadow-lg hover:bg-red-600 hover:scale-105 transition-all group" 
            title="Cerrar Sesión"
        >
            <LogOut size={20} />
        </button>
      </div>

      {/* Panel Izquierdo: Menú */}
      <div className="flex-1 min-h-0 h-full">
        <MenuPanel menuItems={menuItems} onProductClick={handleProductClick} />
      </div>

      {/* Panel Derecho: Carrito */}
      <div className="w-full md:w-[400px] md:border-l md:border-slate-200 shadow-2xl z-10 bg-white h-full">
        <CartPanel cart={cart} cartTotal={cartTotal} updateQty={updateQty} removeFromCart={removeFromCart} onCheckout={handleCheckout} showTicket={showTicket} lastOrderNumber={ticketInfo.orderNumber} loadingOrder={loadingOrder} />
      </div>

      {/* Modales */}
      <ProductOptionsModal isOpen={showProductModal} product={selectedProduct} globalConfig={config} onClose={() => setShowProductModal(false)} onConfirm={(item) => { addToCart(item); setShowProductModal(false); }} />
      <TicketModal isOpen={showTicket} onClose={() => { setShowTicket(false); setPendingOrderData(null); }} onConfirm={handleConfirmOrder} ticketItems={ticketInfo.items} orderData={pendingOrderData || {}} currentOrderId={ticketInfo.orderId} currentOrderNumber={ticketInfo.orderNumber} loading={loadingOrder} tempQrId={Date.now()} />
      <OrdersHistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} onReprint={handleReprint} />
    </div>
  );
}