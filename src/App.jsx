import React, { useState } from "react";
import { useMenu } from "./hooks/useMenu";
import { useCart } from "./hooks/useCart";
import { useOrders } from "./hooks/useOrders";
import { useConfig } from "./hooks/useConfig"; // <--- Nuevo Hook
import MenuPanel from "./components/MenuPanel";
import CartPanel from "./components/CartPanel";
import TicketModal from "./components/TicketModal";
import ProductOptionsModal from "./components/ProductOptionsModal";

export default function App() {
  const { menuItems } = useMenu();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { saveOrder, loading: loadingOrder } = useOrders();
  
  // Cargar configuración global desde Firebase
  const { config, loadingConfig } = useConfig();

  const [showTicket, setShowTicket] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState({ orderId: null, orderNumber: null, items: [] });

  // Pantalla de Carga Inicial (Bloquea la app hasta tener ingredientes y precios)
  if (loadingConfig) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold">
        Cargando configuración del sistema...
      </div>
    );
  }

  const handleProductClick = (product) => {
    const needsConfig = 
        product.mainCategory === "Pizzas" || 
        product.mainCategory === "Platos" || 
        product.name.toLowerCase().includes("combo");

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

      const { number, id } = await saveOrder({ 
        orderData: orderPayload, 
        cartItems: cart 
      });

      setTicketInfo(prev => ({ ...prev, orderId: id, orderNumber: number }));
      alert(`¡Orden #${number} guardada con éxito!`);
      clearCart();
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión.");
    }
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    setTicketInfo({ orderId: null, orderNumber: null, items: [] });
    setPendingOrderData(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      <div className="flex-1 min-h-0 h-full">
        <MenuPanel 
            menuItems={menuItems} 
            onProductClick={handleProductClick} 
        />
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

      {/* Pasamos la configuración global al modal */}
      <ProductOptionsModal
        isOpen={showProductModal}
        product={selectedProduct}
        onClose={() => setShowProductModal(false)}
        onConfirm={handleConfirmModal}
        globalConfig={config} // <--- AQUÍ PASAMOS LA DATA DE FIREBASE
      />

      <TicketModal
        isOpen={showTicket}
        onClose={handleCloseTicket}
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