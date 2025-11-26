import React, { useState } from "react";
import { useMenu } from "./hooks/useMenu";
import { useCart } from "./hooks/useCart";
import { useOrders } from "./hooks/useOrders";
import MenuPanel from "./components/MenuPanel";
import CartPanel from "./components/CartPanel";
import TicketModal from "./components/TicketModal";
import ProductOptionsModal from "./components/ProductOptionsModal";

export default function App() {
  const { menuItems } = useMenu();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { saveOrder, loading } = useOrders();

  const [showTicket, setShowTicket] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState({ orderId: null, orderNumber: null, items: [] });

  const handleProductClick = (product) => {
    // TODAS las Pizzas abren modal. 
    // Dentro del modal se decide si muestra selector de tamaño (solo Clásica) o solo extras.
    if (product.mainCategory === "Pizzas") {
      setSelectedProduct(product);
      setShowProductModal(true);
    } else {
      // Bebidas, Hamburguesas, etc. directo al carrito
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
    setTicketInfo({
        orderId: null,
        orderNumber: null,
        items: [...cart]
    });
    setShowTicket(true);
  };

  const handleConfirmOrder = async () => {
    if (!pendingOrderData) return;
    try {
      const finalTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
      const orderPayload = {
        ...pendingOrderData,
        total: finalTotal,
        subtotal: finalTotal,
        status: 'nuevo',
        customerName: pendingOrderData.customerName || "Cliente Mostrador"
      };

      const { number, id } = await saveOrder({ 
        orderData: orderPayload, 
        cartItems: cart 
      });

      setTicketInfo(prev => ({ ...prev, orderId: id, orderNumber: number }));
      alert(`¡Orden #${number} guardada con éxito!`);
      clearCart();
    } catch (error) {
      console.error(error);
      alert("Error al guardar la orden.");
    }
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    setTicketInfo({ orderId: null, orderNumber: null, items: [] });
    setPendingOrderData(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Menú */}
      <div className="flex-1 min-h-0 h-full">
        <MenuPanel 
            menuItems={menuItems} 
            onProductClick={handleProductClick} 
        />
      </div>

      {/* Carrito */}
      <div className="w-full md:w-auto md:border-l md:border-slate-200">
        <CartPanel
          cart={cart}
          cartTotal={cartTotal}
          updateQty={updateQty}
          removeFromCart={removeFromCart}
          onCheckout={handleCheckout}
          showTicket={showTicket}
          lastOrderNumber={ticketInfo.orderNumber}
          loadingOrder={loading}
        />
      </div>

      {/* Modales */}
      <ProductOptionsModal
        isOpen={showProductModal}
        product={selectedProduct}
        onClose={() => setShowProductModal(false)}
        onConfirm={handleConfirmModal}
      />

      <TicketModal
        isOpen={showTicket}
        onClose={handleCloseTicket}
        onConfirm={handleConfirmOrder}
        ticketItems={ticketInfo.items}
        orderData={pendingOrderData || {}}
        currentOrderId={ticketInfo.orderId}
        currentOrderNumber={ticketInfo.orderNumber}
        loading={loading}
        tempQrId={Date.now()}
      />
    </div>
  );
}