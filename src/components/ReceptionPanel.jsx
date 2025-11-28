import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useMenu } from "../hooks/useMenu";
import { useCart } from "../hooks/useCart";
import { useOrders } from "../hooks/useOrders";
import { useConfig } from "../hooks/useConfig";
import { collection, onSnapshot } from "firebase/firestore"; // Import necesario para cargar ingredientes/sides
import { db } from "../services/firebase"; // Import de db
import MenuPanel from "./MenuPanel";
import CartPanel from "./CartPanel";
import TicketModal from "./TicketModal";
import ProductDispatcher from "./ProductDispatcher"; // IMPORTANTE: Importamos el Dispatcher
import OrdersHistoryModal from "./OrdersHistoryModal";

export default function ReceptionPanel({ onLogout }) {
  const { menuItems } = useMenu();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { saveOrder, loading: loadingOrder } = useOrders();
  const { config, loadingConfig } = useConfig();

  const [showTicket, setShowTicket] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState({ orderId: null, orderNumber: null, items: [] });

  // Estados para datos auxiliares (Ingredientes, Sides, etc.)
  const [ingredients, setIngredients] = useState([]);
  const [sides, setSides] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [potatoes, setPotatoes] = useState([]); // Si tienes colección de papas
  const [sauces, setSauces] = useState([]);     // Si tienes colección de salsas

  // Cargar datos auxiliares en tiempo real o una sola vez
  useEffect(() => {
    // Puedes optimizar esto moviéndolo a un hook separado (useInventory) si prefieres
    const unsubs = [
      onSnapshot(collection(db, "ingredients"), (snap) => 
        setIngredients(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, "sides"), (snap) => 
        setSides(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      ),
      // Agrega listeners para drinks, potatoes, sauces si existen en tu DB como colecciones separadas
      // Si están en 'config', úsalos desde el hook useConfig
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  if (loadingConfig) return <div className="h-screen flex items-center justify-center bg-slate-950 font-bold text-slate-500 animate-pulse text-xl">Cargando Sistema...</div>;

  const handleProductClick = (product) => {
    // Lógica simplificada: El Dispatcher se encarga de decidir qué mostrar
    // Si es un producto simple sin opciones (ej: agua embotellada simple), podrías agregarlo directo aquí
    // pero para mantener consistencia, pasamos todo por el dispatcher o validamos "simple".
    
    // Ejemplo: Si es simple y no requiere modal, agregar directo. 
    // Por ahora, asumimos que todo pasa por la selección (o el dispatcher devuelve null y agrega directo si lo modificas)
    setSelectedProduct(product); 
  };

  const handleCheckout = (formData) => {
    setPendingOrderData(formData);
    setTicketInfo({ orderId: null, orderNumber: null, items: [...cart] });
    setShowTicket(true);
  };

  const handleConfirmOrder = async () => {
    if (!pendingOrderData || loadingOrder) return;
    const toastId = toast.loading("Enviando orden a cocina...");
    try {
      const orderPayload = {
        ...pendingOrderData,
        total: Number(cartTotal.toFixed(2)),
        subtotal: Number(cartTotal.toFixed(2)),
        customerName: pendingOrderData.customerName || "Cliente Mostrador"
      };
      const { number, id } = await saveOrder({ orderData: orderPayload, cartItems: cart });
      setTicketInfo(prev => ({ ...prev, orderId: id, orderNumber: number }));
      toast.success(`Orden #${number} enviada con éxito`, { id: toastId });
      clearCart();
    } catch (error) { toast.error("Error al guardar", { id: toastId }); }
  };

  const handleReprint = (order) => {
    setPendingOrderData({
        customerName: order.customerName, orderType: order.orderType,
        customerPhone: order.customerPhone, customerAddress: order.customerAddress, orderNotes: order.orderNotes
    });
    setTicketInfo({ orderId: order.id, orderNumber: order.number, items: order.itemsSnapshot || [] });
    setShowTicket(true); setShowHistory(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden relative selection:bg-orange-500 selection:text-white">
      
      {/* Panel Izquierdo: Menú */}
      <div className="flex-1 min-h-0 h-full">
        <MenuPanel 
            menuItems={menuItems} 
            onProductClick={handleProductClick} 
            onLogout={onLogout}
            onHistory={() => setShowHistory(true)}
        />
      </div>

      {/* Panel Derecho: Carrito */}
      <div className="w-full md:w-[400px] border-l border-slate-800 shadow-2xl z-10 bg-slate-900 h-full">
        <CartPanel cart={cart} cartTotal={cartTotal} updateQty={updateQty} removeFromCart={removeFromCart} onCheckout={handleCheckout} showTicket={showTicket} lastOrderNumber={ticketInfo.orderNumber} loadingOrder={loadingOrder} />
      </div>

      {/* MODALES */}
      
      {/* REEMPLAZO: ProductDispatcher maneja la lógica de qué modal mostrar */}
      {selectedProduct && (
        <ProductDispatcher 
            selectedProduct={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onConfirm={(finalItem) => {
                addToCart(finalItem);
                setSelectedProduct(null);
                toast.success("Producto agregado");
            }}
            // Pasamos los datos cargados del inventario
            ingredients={ingredients} 
            sides={sides} 
            drinks={config?.drinks || []} // Si usas drinks de config global
            potatoes={potatoes} 
            sauces={sauces} 
            globalConfig={config}
        />
      )}

      <TicketModal isOpen={showTicket} onClose={() => { setShowTicket(false); setPendingOrderData(null); }} onConfirm={handleConfirmOrder} ticketItems={ticketInfo.items} orderData={pendingOrderData || {}} currentOrderId={ticketInfo.orderId} currentOrderNumber={ticketInfo.orderNumber} loading={loadingOrder} tempQrId={Date.now()} />
      <OrdersHistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} onReprint={handleReprint} />
    </div>
  );
}