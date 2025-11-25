import React, { useState } from 'react';
import { useMenu } from './hooks/useMenu';
import { useCart } from './hooks/useCart';
import { useOrders } from './hooks/useOrders';
import MenuPanel from './components/MenuPanel';
import CartPanel from './components/CartPanel';
import TicketModal from './components/TicketModal';

export default function App() {
  // Hooks de Lógica
  const { menuItems } = useMenu();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { saveOrder, loading } = useOrders();

  // Estados de UI y Transitorios
  const [showTicket, setShowTicket] = useState(false);
  const [ticketItems, setTicketItems] = useState([]);
  const [tempQrId, setTempQrId] = useState(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  
  // Estado temporal para los datos del formulario antes de confirmar
  const [pendingOrderData, setPendingOrderData] = useState({});

  // Handlers
  const handleCheckoutRequest = (formData) => {
    // Snapshot de datos para el ticket
    setPendingOrderData(formData);
    setTicketItems([...cart]);
    setTempQrId(Date.now());
    setShowTicket(true);
  };

  const handleConfirmOrder = async () => {
    try {
      // Recalcular total desde el snapshot para seguridad
      const totalToSave = ticketItems.reduce(
        (t, i) => t + i.price * i.qty,
        0
      );

      // Construir objeto final mezclando datos de form y totales
      const orderData = {
        ...pendingOrderData, // trae type, customerName, phone, address, notes, deliveryNotes
        subtotal: totalToSave,
        total: totalToSave
      };

      const { number, id } = await saveOrder({ 
        orderData, 
        cartItems: ticketItems 
      });

      setCurrentOrderNumber(number);
      setCurrentOrderId(id);
      
      // Limpiamos el carrito real, pero el ticket sigue mostrando el snapshot
      clearCart();
    } catch (error) {
      alert("Error al guardar el pedido.");
    }
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    // Reset estados transitorios solo si ya se confirmó o si se canceló la vista
    if (currentOrderId) {
      setCurrentOrderId(null);
      setCurrentOrderNumber(null);
      setTicketItems([]);
      setTempQrId(null);
      setPendingOrderData({});
    } else {
      // Si cerró sin confirmar (botón volver), solo cerramos modal, mantenemos carrito
      setTicketItems([]);
      setTempQrId(null);
      setPendingOrderData({});
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      <MenuPanel 
        menuItems={menuItems} 
        onAddToCart={addToCart} 
      />
      
      <CartPanel 
        cart={cart}
        cartTotal={cartTotal}
        updateQty={updateQty}
        removeFromCart={removeFromCart}
        onCheckout={handleCheckoutRequest}
        lastOrderNumber={currentOrderNumber}
        loadingOrder={loading}
        // Props no usadas removidas (menuItems ya no se usa en cart panel sin IA)
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
    </div>
  );
}