import React, { useState } from "react";
import { useMenu } from "../hooks/useMenu";
import { useCart } from "../hooks/useCart";
import { useOrders } from "../hooks/useOrders";
import { useConfig } from "../hooks/useConfig";
import MenuPanel from "./MenuPanel";
import CartPanel from "./CartPanel";
import TicketModal from "./TicketModal";
import ProductOptionsModal from "./ProductOptionsModal";
import { LogOut } from "lucide-react"; 
import { toast } from "react-hot-toast";

export default function ReceptionPanel({ onLogout }) { 
  const { menuItems } = useMenu();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { saveOrder, loading: loadingOrder } = useOrders();
  const { config, loadingConfig } = useConfig();

  const [showTicket, setShowTicket] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState({ orderId: null, orderNumber: null, items: [] });

  if (loadingConfig) return <div className="h-screen flex items-center justify-center">Cargando menú...</div>;

  const handleConfirmOrder = async () => {
    if (!pendingOrderData || loadingOrder) return;

  
  
  const handleProductClick = (product) => {
    const name = product.name?.toLowerCase() || "";
    const needsConfig = 
        product.mainCategory === "Pizzas" || 
        product.mainCategory === "Platos" || 
        name.includes("combo");

    if (needsConfig) {
      setSelectedProduct(product);
      setShowProductModal(true);
    } else {
      addToCart(product);
    }
  };

  const handleConfirmModal = (finalItem) => {
    addToCart(finalItem);
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const handleCheckout = (formData) => {
    setPendingOrderData(formData);
    setTicketInfo({ orderId: null, orderNumber: null, items: [...cart] });
    setShowTicket(true);
  };

  const handleConfirmOrder = async () => {
    if (!pendingOrderData || loadingOrder) return;
    try {
      const finalTotal = Number(cart.reduce((acc, item) => acc + (item.price * item.qty), 0).toFixed(2));
      const orderPayload = {
        ...pendingOrderData,
        total: finalTotal,
        subtotal: finalTotal,
        status: 'nuevo',
        customerName: pendingOrderData.customerName || "Mostrador"
      };
      const { number, id } = await saveOrder({ orderData: orderPayload, cartItems: cart });
      setTicketInfo(prev => ({ ...prev, orderId: id, orderNumber: number }));
      alert(`¡Orden #${number} guardada!`);
      clearCart();
    } catch (error) {
      console.error(error);
      alert("Error guardando orden.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      {/* Botón de Salir Flotante o en Header */}
      <button 
        onClick={onLogout}
        className="absolute top-4 right-4 z-50 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700"
        title="Cerrar Sesión"
      >
        <LogOut size={16} />
      </button>

      <div className="flex-1 min-h-0 h-full">
        <MenuPanel menuItems={menuItems} onProductClick={handleProductClick} />
      </div>
      <div className="w-full md:w-auto md:border-l md:border-slate-200">
        <CartPanel
          cart={cart}
          cartTotal={cartTotal}
          updateQty={updateQty}
          removeFromCart={removeFromCart}
          onCheckout={handleCheckout}
          showTicket={showTicket}
          lastOrderNumber={ticketInfo.orderNumber}
          loadingOrder={loadingOrder}
        />
      </div>
      <ProductOptionsModal
        isOpen={showProductModal}
        product={selectedProduct}
        globalConfig={config}
        onClose={() => setShowProductModal(false)}
        onConfirm={handleConfirmModal}
      />
      <TicketModal
        isOpen={showTicket}
        onClose={() => { setShowTicket(false); setPendingOrderData(null); }}
        onConfirm={handleConfirmOrder}
        ticketItems={ticketInfo.items}
        orderData={pendingOrderData || {}}
        currentOrderId={ticketInfo.orderId}
        currentOrderNumber={ticketInfo.orderNumber}
        loading={loadingOrder}
        tempQrId={Date.now()}
      />
    </div>
  );
}