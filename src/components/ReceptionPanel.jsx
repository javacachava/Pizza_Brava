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

  if (loadingConfig) return <div className="h-screen flex items-center justify-center bg-slate-100 font-bold animate-pulse">Cargando...</div>;

  const handleProductClick = (product) => {
    const isClassic = product.pizzaType === "Clasica" || product.name.toLowerCase().includes("clásica");
    const isCombo = product.comboOptions && (product.comboOptions.hasDrink || product.comboOptions.hasSide);
    const isSpecialty = product.mainCategory === "Pizzas" && !isClassic; 
    if (isClassic || isCombo || isSpecialty) {
      setSelectedProduct(product); setShowProductModal(true);
    } else {
      addToCart(product); toast.success("Agregado");
    }
  };

  const handleCheckout = (formData) => {
    setPendingOrderData(formData);
    setTicketInfo({ orderId: null, orderNumber: null, items: [...cart] });
    setShowTicket(true);
  };

  const handleConfirmOrder = async () => {
    if (!pendingOrderData || loadingOrder) return;
    const toastId = toast.loading("Enviando...");
    try {
      const orderPayload = {
        ...pendingOrderData,
        total: Number(cartTotal.toFixed(2)),
        subtotal: Number(cartTotal.toFixed(2)),
        customerName: pendingOrderData.customerName || "Cliente Mostrador"
      };
      const { number, id } = await saveOrder({ orderData: orderPayload, cartItems: cart });
      setTicketInfo(prev => ({ ...prev, orderId: id, orderNumber: number }));
      toast.success(`Orden #${number} creada`, { id: toastId });
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
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button onClick={() => setShowHistory(true)} className="bg-white text-slate-700 p-2 rounded-full shadow-lg hover:bg-slate-50 border border-slate-200" title="Historial"><History size={18} /></button>
        <button onClick={onLogout} className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700" title="Cerrar Sesión"><LogOut size={18} /></button>
      </div>
      <div className="flex-1 min-h-0 h-full">
        <MenuPanel menuItems={menuItems} onProductClick={handleProductClick} />
      </div>
      <div className="w-full md:w-auto md:border-l md:border-slate-200 shadow-xl z-10">
        <CartPanel cart={cart} cartTotal={cartTotal} updateQty={updateQty} removeFromCart={removeFromCart} onCheckout={handleCheckout} showTicket={showTicket} lastOrderNumber={ticketInfo.orderNumber} loadingOrder={loadingOrder} />
      </div>
      <ProductOptionsModal isOpen={showProductModal} product={selectedProduct} globalConfig={config} onClose={() => setShowProductModal(false)} onConfirm={(item) => { addToCart(item); setShowProductModal(false); }} />
      <TicketModal isOpen={showTicket} onClose={() => { setShowTicket(false); setPendingOrderData(null); }} onConfirm={handleConfirmOrder} ticketItems={ticketInfo.items} orderData={pendingOrderData || {}} currentOrderId={ticketInfo.orderId} currentOrderNumber={ticketInfo.orderNumber} loading={loadingOrder} tempQrId={Date.now()} />
      <OrdersHistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} onReprint={handleReprint} />
    </div>
  );
}