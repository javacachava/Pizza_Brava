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

  const [showTicket, setShowTicket] = useState(false);
  const [ticketItems, setTicketItems] = useState([]);
  const [tempQrId, setTempQrId] = useState(null);
  const [currentOrderNumber, setCurrentOrderNumber] =
    useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState({});

  // Modal de opciones de pizza
  const [showProductModal, setShowProductModal] =
    useState(false);
  const [selectedBaseProduct, setSelectedBaseProduct] =
    useState(null);

  const handleProductClick = (product) => {
    // Si es pizza -> modal
    if (product.mainCategory === "Pizzas") {
      setSelectedBaseProduct(product);
      setShowProductModal(true);
    } else {
      addToCart(product);
    }
  };

  const handleConfirmConfiguredProduct = (item) => {
    addToCart(item);
  };

  const handleCheckoutRequest = (formData) => {
    // Validaciones fuertes para Teléfono
    if (formData.orderType === "telefono") {
      if (!formData.customerName.trim()) {
        alert("Nombre de cliente es obligatorio.");
        return;
      }
      if (!formData.customerPhone.trim()) {
        alert("Teléfono de contacto es obligatorio.");
        return;
      }
      if (!formData.customerAddress.trim()) {
        alert("Dirección de entrega es obligatoria.");
        return;
      }
    }

    setPendingOrderData(formData);
    setTicketItems([...cart]);
    setTempQrId(Date.now());
    setShowTicket(true);
  };

  const handleConfirmOrder = async () => {
    try {
      const totalToSave = ticketItems.reduce(
        (t, i) => t + i.price * i.qty,
        0
      );

      const orderData = {
        orderType: pendingOrderData.orderType,
        customerName:
          pendingOrderData.customerName?.trim() ||
          (pendingOrderData.orderType === "local"
            ? "Cliente Local"
            : "Anónimo"),
        customerPhone: pendingOrderData.customerPhone || "",
        customerAddress:
          pendingOrderData.customerAddress || "",
        orderNotes: pendingOrderData.orderNotes || "",
        subtotal: totalToSave,
        total: totalToSave,
        status: "nuevo"
      };

      const { number, id } = await saveOrder({
        orderData,
        cartItems: ticketItems
      });

      setCurrentOrderNumber(number);
      setCurrentOrderId(id);

      alert(`¡Pedido #${number} enviado a cocina!`);
      clearCart();
    } catch (error) {
      alert("Error al guardar el pedido.");
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
    } else {
      setTicketItems([]);
      setTempQrId(null);
      setPendingOrderData({});
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      <MenuPanel
        menuItems={menuItems}
        onProductClick={handleProductClick}
      />

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
        onClose={() => setShowProductModal(false)}
        baseProduct={selectedBaseProduct}
        onConfirm={handleConfirmConfiguredProduct}
      />
    </div>
  );
}
