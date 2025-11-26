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

  // Estados UI
  const [showTicket, setShowTicket] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Estados Datos
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState({ orderId: null, orderNumber: null, items: [] });

  // --- MANEJADOR DE CLICKS EN PRODUCTOS ---
  const handleProductClick = (product) => {
    // Regla: Todas las Pizzas abren modal (para verificar tamaño o ingredientes)
    if (product.mainCategory === "Pizzas") {
      setSelectedProduct(product);
      setShowProductModal(true);
    } else {
      // Bebidas, Hamburguesas, etc. se agregan directo (salvo que quieras modal también para ellos en el futuro)
      addToCart(product);
    }
  };

  const handleConfirmModal = (finalItem) => {
    addToCart(finalItem);
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  // --- PROCESO DE COBRO (Validación ya hecha en CartPanel) ---
  const handleCheckout = (formData) => {
    setPendingOrderData(formData);
    // Preparamos los items para el ticket visual
    setTicketInfo({
        orderId: null,
        orderNumber: null,
        items: [...cart]
    });
    setShowTicket(true);
  };

  // --- CONFIRMAR Y GUARDAR EN FIREBASE ---
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

      // Actualizar ticket con datos reales de DB
      setTicketInfo(prev => ({ ...prev, orderId: id, orderNumber: number }));
      
      alert(`¡Orden #${number} guardada con éxito!`);
      clearCart();
      // No cerramos el ticket automáticamente para que puedan ver el QR/Numero
    } catch (error) {
      console.error(error);
      alert("Error al guardar la orden. Revisa la consola.");
    }
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    setTicketInfo({ orderId: null, orderNumber: null, items: [] });
    setPendingOrderData(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Panel Izquierdo: Menú */}
      <div className="flex-1 min-h-0 h-full">
        <MenuPanel 
            menuItems={menuItems} 
            onProductClick={handleProductClick} 
        />
      </div>

      {/* Panel Derecho: Carrito */}
      <div className="w-full md:w-auto md:border-l md:border-slate-200">
        <CartPanel
          cart={cart}
          cartTotal={cartTotal}
          updateQty={updateQty}
          removeFromCart={removeFromCart}
          onCheckout={handleCheckout}
          showTicket={showTicket}
          lastOrderNumber={ticketInfo.orderNumber} // Muestra el último número generado si existe en sesión
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
        tempQrId={Date.now()} // Solo para visualización antes de guardar
      />
    </div>
  );
}