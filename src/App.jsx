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
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    cartTotal
  } = useCart();
  const { saveOrder, loading } = useOrders();

  // Estados
  const [showTicket, setShowTicket] = useState(false);
  const [ticketItems, setTicketItems] = useState([]);
  const [tempQrId, setTempQrId] = useState(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState({});

  // Modal Producto
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedBaseProduct, setSelectedBaseProduct] = useState(null);

  // --- LOGICA NUEVA DE CLICK ---
  const handleProductClick = (product) => {
    // 1. Si es PIZZA (cualquier tipo), abrimos el modal.
    // El modal se encargará de mostrar selector de tamaño SI es 'Clasica'.
    if (product.mainCategory === "Pizzas") {
      setSelectedBaseProduct(product);
      setShowProductModal(true);
      return;
    }

    // 2. Todo lo demás se agrega directo (Bebidas, Burgers, etc.)
    addToCart(product);
  };

  const handleConfirmConfiguredProduct = (configuredItem) => {
    addToCart(configuredItem);
    setShowProductModal(false);
    setSelectedBaseProduct(null);
  };

  // Checkout y Ticket (sin cambios mayores)
  const handleCheckoutRequest = (formData) => {
    if (formData.orderType === "telefono") {
      if (!formData.customerName?.trim()) alert("Nombre requerido.");
      else if (!formData.customerPhone?.trim()) alert("Teléfono requerido.");
      else if (!formData.customerAddress?.trim()) alert("Dirección requerida.");
      else processCheckout(formData);
    } else {
      processCheckout(formData);
    }
  };

  const processCheckout = (formData) => {
    setPendingOrderData(formData);
    setTicketItems([...cart]);
    setTempQrId(Date.now());
    setShowTicket(true);
  };

  const handleConfirmOrder = async () => {
    try {
      const totalToSave = ticketItems.reduce((t, i) => t + i.price * i.qty, 0);
      const orderData = {
        ...pendingOrderData,
        customerName: pendingOrderData.customerName?.trim() || "Mostrador",
        subtotal: totalToSave,
        total: totalToSave,
        status: "nuevo"
      };

      const { number, id } = await saveOrder({ orderData, cartItems: ticketItems });
      setCurrentOrderNumber(number);
      setCurrentOrderId(id);
      alert(`¡Pedido #${number} enviado!`);
      clearCart();
    } catch (error) {
      console.error(error);
      alert("Error al guardar pedido.");
    }
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    if (currentOrderId) {
      setCurrentOrderId(null);
      setCurrentOrderNumber(null);
      setTicketItems([]);
      setTempQrId(null);
      setPendingOrderData({});
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      <div className="flex-1 min-h-0">
        <MenuPanel menuItems={menuItems} onProductClick={handleProductClick} />
      </div>
      <div className="w-full md:w-auto md:border-l md:border-slate-200">
        <CartPanel
          cart={cart}
          cartTotal={cartTotal}
          updateQty={updateQty}
          removeFromCart={removeFromCart}
          onCheckout={handleCheckoutRequest}
          showTicket={showTicket}
          lastOrderNumber={currentOrderNumber}
          loadingOrder={loading}
        />
      </div>

      <TicketModal
        isOpen={showTicket}
        onClose={handleCloseTicket}
        onConfirm={handleConfirmOrder}
        ticketItems={ticketItems}
        orderData={pendingOrderData}
        currentOrderId={currentOrderId}
        currentOrderNumber={currentOrderNumber}
        loading={loading}
        tempQrId={tempQrId}
      />

      <ProductOptionsModal
        isOpen={showProductModal}
        product={selectedBaseProduct}
        onClose={() => {
          setShowProductModal(false);
          setSelectedBaseProduct(null);
        }}
        onConfirm={handleConfirmConfiguredProduct}
      />
    </div>
  );
}