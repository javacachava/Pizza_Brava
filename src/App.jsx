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

  // Ticket / orden
  const [showTicket, setShowTicket] = useState(false);
  const [ticketItems, setTicketItems] = useState([]);
  const [tempQrId, setTempQrId] = useState(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState({});

  // Modal de configuración de producto (pizzas, etc.)
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedBaseProduct, setSelectedBaseProduct] = useState(null);

  // Lógica: qué pasa cuando tocan un producto en el menú
  const handleProductClick = (product) => {
    // Regla simple: si es pizza, abre modal; si no, directo al carrito.
    if (product.mainCategory === "Pizzas") {
      setSelectedBaseProduct(product);
      setShowProductModal(true);
    } else {
      addToCart(product);
    }
  };

  // Cuando el usuario confirma la pizza configurada en el modal
  const handleConfirmConfiguredProduct = (configuredItem) => {
    addToCart(configuredItem);
    setShowProductModal(false);
    setSelectedBaseProduct(null);
  };

  // Paso 1: recibir datos del formulario del carrito y mostrar ticket
  const handleCheckoutRequest = (formData) => {
    // Validaciones fuertes para Teléfono
    if (formData.orderType === "telefono") {
      if (!formData.customerName?.trim()) {
        alert("Nombre de cliente es obligatorio.");
        return;
      }
      if (!formData.customerPhone?.trim()) {
        alert("Teléfono de contacto es obligatorio.");
        return;
      }
      if (!formData.customerAddress?.trim()) {
        alert("Dirección de entrega es obligatoria.");
        return;
      }
    }

    setPendingOrderData(formData);
    setTicketItems([...cart]);
    setTempQrId(Date.now());
    setShowTicket(true);
  };

  // Paso 2: confirmar ticket y guardar en Firestore
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
        customerAddress: pendingOrderData.customerAddress || "",
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

  // Cerrar ticket (después de confirmar o al volver)
  const handleCloseTicket = () => {
    setShowTicket(false);

    if (currentOrderId) {
      // Ya se guardó la orden
      setCurrentOrderId(null);
      setCurrentOrderNumber(null);
      setTicketItems([]);
      setTempQrId(null);
      setPendingOrderData({});
    } else {
      // Solo estaba viendo el ticket sin confirmar
      setTicketItems([]);
      setTempQrId(null);
      setPendingOrderData({});
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* IZQUIERDA / ARRIBA: MENÚ */}
      <div className="flex-1 min-h-0">
        <MenuPanel
          menuItems={menuItems}
          onProductClick={handleProductClick} // <-- AQUÍ va, NO onAddToCart
        />
      </div>

      {/* DERECHA / ABAJO: CARRITO */}
      <div className="w-full md:w-auto md:border-l md:border-slate-200">
        <CartPanel
          cart={cart}
          cartTotal={cartTotal}
          updateQty={updateQty}
          removeFromCart={removeFromCart}
          onAddToCart={addToCart}
          onCheckout={handleCheckoutRequest}
          showTicket={showTicket}
          menuItems={menuItems}
          lastOrderNumber={currentOrderNumber}
          loadingOrder={loading}
        />
      </div>

      {/* MODAL TICKET */}
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

      {/* MODAL OPCIONES DE PRODUCTO (PIZZAS) */}
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
