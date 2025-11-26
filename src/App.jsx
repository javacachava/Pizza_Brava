import React, { useState } from "react";
import { useMenu } from "./hooks/useMenu";
import { useCart } from "./hooks/useCart";
import { useOrders } from "./hooks/useOrders";
import { useConfig } from "./hooks/useConfig";
import MenuPanel from "./components/MenuPanel";
import CartPanel from "./components/CartPanel";
import TicketModal from "./components/TicketModal";
import ProductOptionsModal from "./components/ProductOptionsModal";

export default function App() {
  const { menuItems } = useMenu();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { saveOrder, loading: loadingOrder } = useOrders();
  
  // Cargamos ingredientes globales y precios base
  const { pizzaIngredients, prices, loadingConfig } = useConfig();

  const [showTicket, setShowTicket] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState({ orderId: null, orderNumber: null, items: [] });

  if (loadingConfig) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold">Cargando sistema...</div>;
  }

  const handleProductClick = (product) => {
    // Analizamos si el producto requiere configuración
    // 1. Es Pizza Clásica
    const isClassic = product.pizzaType === "Clasica" || product.name.toLowerCase().includes("clásica");
    // 2. Es un Combo con opciones definidas en DB
    const isComboWithChoices = product.comboOptions && (product.comboOptions.hasDrink || product.comboOptions.hasSide);
    // 3. Es una pizza especialidad (opcional: agregar ingredientes extra)
    const isSpecialtyPizza = product.mainCategory === "Pizzas" && !isClassic;

    if (isClassic || isComboWithChoices || isSpecialtyPizza) {
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
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
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
        ingredientsList={pizzaIngredients} // Lista maestra de ingredientes
        prices={prices} // Reglas de precios globales
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