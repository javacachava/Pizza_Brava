import React, { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { LogOut } from "lucide-react";
import { useMenu } from "../hooks/useMenu";
import { useCart } from "../hooks/useCart";
import { useOrders } from "../hooks/useOrders";
import { useConfig } from "../hooks/useConfig";
import MenuPanel from "./MenuPanel";
import CartPanel from "./CartPanel";
import TicketModal from "./TicketModal";
import ProductOptionsModal from "./ProductOptionsModal";

export default function ReceptionPanel({ onLogout }) {
  // Hooks de lógica de negocio
  const { menuItems } = useMenu();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { saveOrder, loading: loadingOrder } = useOrders();
  
  // Configuración Global (Ingredientes, Precios, etc. desde Firebase)
  const { config, loadingConfig } = useConfig();

  // Estados de Interfaz
  const [showTicket, setShowTicket] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Estados de Datos Temporales
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState({ orderId: null, orderNumber: null, items: [] });

  // Pantalla de carga si no hay config
  if (loadingConfig) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 text-slate-500 font-bold animate-pulse">
        Cargando sistema...
      </div>
    );
  }

  // --- LÓGICA: SELECCIÓN DE PRODUCTO ---
  const handleProductClick = (product) => {
    // Detectamos si el producto necesita configuración (Modal)
    // 1. Es Pizza Clásica (Pide tamaño + ingredientes)
    // 2. Es Combo (Pide bebida + entrada)
    // 3. Es Especialidad (Opcional: permite extras)
    
    const isClassic = product.pizzaType === "Clasica" || product.name.toLowerCase().includes("clásica");
    const isCombo = product.comboOptions && (product.comboOptions.hasDrink || product.comboOptions.hasSide);
    const isSpecialty = product.mainCategory === "Pizzas" && !isClassic; // Pizzas normales también abren modal para extras

    if (isClassic || isCombo || isSpecialty) {
      setSelectedProduct(product);
      setShowProductModal(true);
    } else {
      // Productos simples (Agua, Cerveza) se agregan directo
      addToCart(product);
      toast.success(`${product.name} agregado`, { duration: 1500, position: 'bottom-center' });
    }
  };

  // Confirmación desde el Modal
  const handleConfirmModal = (finalItem) => {
    addToCart(finalItem);
    setShowProductModal(false);
    setSelectedProduct(null);
    toast.success("Producto agregado", { duration: 2000, position: 'bottom-center' });
  };

  // --- LÓGICA: COBRO ---
  const handleCheckout = (formData) => {
    setPendingOrderData(formData);
    // Preparamos datos para el Ticket Visual
    setTicketInfo({ 
        orderId: null, 
        orderNumber: null, 
        items: [...cart] 
    });
    setShowTicket(true);
  };

  // Confirmación Final (Guardar en Firebase)
  const handleConfirmOrder = async () => {
    if (!pendingOrderData || loadingOrder) return;

    const toastId = toast.loading("Enviando a cocina...");

    try {
      // 1. Calcular totales finales asegurando decimales
      const finalTotal = Number(cart.reduce((acc, item) => acc + (item.price * item.qty), 0).toFixed(2));
      
      const orderPayload = {
        ...pendingOrderData,
        total: finalTotal,
        subtotal: finalTotal,
        status: 'nuevo',
        customerName: pendingOrderData.customerName || "Cliente Mostrador"
      };

      // 2. Guardar
      const { number, id } = await saveOrder({ 
        orderData: orderPayload, 
        cartItems: cart 
      });

      // 3. Actualizar UI
      setTicketInfo(prev => ({ ...prev, orderId: id, orderNumber: number }));
      
      toast.success(`¡Orden #${number} lista!`, { id: toastId });
      clearCart();
      
      // Nota: No cerramos el ticket automáticamente para que el cajero pueda ver el número o escanear QR
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión. Intenta de nuevo.", { id: toastId });
    }
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    setTicketInfo({ orderId: null, orderNumber: null, items: [] });
    setPendingOrderData(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      {/* Botón Salir */}
      <button 
        onClick={onLogout}
        className="absolute top-4 right-4 z-50 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-transform active:scale-95"
        title="Cerrar Sesión"
      >
        <LogOut size={18} />
      </button>

      {/* Panel Izquierdo: Menú */}
      <div className="flex-1 min-h-0 h-full">
        <MenuPanel 
            menuItems={menuItems} 
            onProductClick={handleProductClick} 
        />
      </div>

      {/* Panel Derecho: Carrito */}
      <div className="w-full md:w-auto md:border-l md:border-slate-200 shadow-xl z-10">
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

      {/* Modal de Configuración de Producto */}
      <ProductOptionsModal
        isOpen={showProductModal}
        product={selectedProduct}
        globalConfig={config} // Pasamos la configuración descargada de Firebase
        onClose={() => setShowProductModal(false)}
        onConfirm={handleConfirmModal}
      />

      {/* Modal de Ticket/Confirmación */}
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