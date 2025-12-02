// src/components/ReceptionPanel.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "../services/firebase";
import { useMenu } from "../hooks/useMenu";
import { useCart } from "../hooks/useCart";
import { useOrders } from "../hooks/useOrders";
import { useConfig } from "../hooks/useConfig";

import MenuPanel from "./MenuPanel";
import CartPanel from "./CartPanel";
import TicketModal from "./TicketModal";
import OrdersHistoryModal from "./OrdersHistoryModal";
import ProductDispatcher from "./ProductDispatcher";

export default function ReceptionPanel({ onLogout }) {
  // Menú principal (productos)
  const { menuItems } = useMenu();

  // Carrito
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    cartTotal
  } = useCart();

  // Órdenes
  const { saveOrder, loading: loadingOrder } = useOrders();

  // Configuración global (reglas, precios, etc.)
  const { config, loadingConfig } = useConfig();

  // Estado UI
  const [showTicket, setShowTicket] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Datos de la orden actual
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState({
    orderId: null,
    orderNumber: null,
    items: []
  });

  // Datos auxiliares para modales (inventario dinámico)
  const [ingredients, setIngredients] = useState([]);
  const [sides, setSides] = useState([]);
  const [drinksCatalog, setDrinksCatalog] = useState([]);
  const [potatoes, setPotatoes] = useState([]);
  const [sauces, setSauces] = useState([]);

  // Suscripciones en tiempo real a colecciones auxiliares
  useEffect(() => {
    const unsubs = [];

    const subscribe = (colName, setter) => {
      const unsub = onSnapshot(collection(db, colName), (snap) => {
        setter(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
      unsubs.push(unsub);
    };

    subscribe("ingredients", setIngredients);
    subscribe("sides", setSides);
    subscribe("drinks", setDrinksCatalog);
    subscribe("potatoes", setPotatoes);
    subscribe("sauces", setSauces);

    return () => unsubs.forEach((u) => u && u());
  }, []);

  const handleProductClick = (product) => {
    // 1. Definir lógica de qué es una Pizza
    const mainCategory = (product.mainCategory || "").toLowerCase();
    const isPizza =
      mainCategory === "pizzas" ||
      product.pizzaType === "Clasica" ||
      product.pizzaType === "Especialidad";

    // 2. SI ES PIZZA: Seteamos el estado para que se abra el Modal
    if (isPizza) {
      setSelectedProduct(product);
    } 
    // 3. SI ES PRODUCTO SIMPLE: Agregamos directo
    else {
      addToCart({
        ...product,
        qty: 1
      });
      toast.success("Producto agregado");
    }
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
    if (!pendingOrderData || loadingOrder) return;

    const toastId = toast.loading("Enviando orden a cocina...");

    try {
      const orderPayload = {
        ...pendingOrderData,
        total: Number(cartTotal.toFixed(2)),
        subtotal: Number(cartTotal.toFixed(2)),
        customerName: pendingOrderData.customerName || "Cliente Mostrador"
      };

      const result = await saveOrder({
        orderData: orderPayload,
        cartItems: cart
      });

      if (result) {
        setTicketInfo((prev) => ({
          ...prev,
          orderId: result.id,
          orderNumber: result.number
        }));
        toast.success(`Orden #${result.number} enviada con éxito`, { id: toastId });
        clearCart();
      }
    } catch (error) {
      console.error("Error guardando orden:", error);
      toast.error("Error al guardar la orden", { id: toastId });
    }
  };

  const handleReprint = (order) => {
    setPendingOrderData({
      customerName: order.customerName,
      orderType: order.orderType,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      orderNotes: order.orderNotes
    });

    setTicketInfo({
      orderId: order.id,
      orderNumber: order.number,
      items: order.itemsSnapshot || []
    });

    setShowTicket(true);
    setShowHistory(false);
  };

  if (loadingConfig) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 font-bold text-slate-500 animate-pulse text-xl">
        Cargando Sistema...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden relative selection:bg-orange-500 selection:text-white">
      
      {/* Panel Izquierdo: Menú */}
      {/* CORRECCIÓN: Quitamos h-full forzado y dejamos que flex-1 maneje el espacio en móvil */}
      <div className="flex-1 min-h-0">
        <MenuPanel
          menuItems={menuItems}
          onProductClick={handleProductClick}
          onLogout={onLogout}
          onHistory={() => setShowHistory(true)}
        />
      </div>

      {/* Panel Derecho: Carrito */}
      {/* CORRECCIÓN: Altura fija en móvil (40%) y Full en escritorio */}
      <div className="w-full h-[40%] md:h-full md:w-[400px] border-t md:border-t-0 md:border-l border-slate-800 shadow-2xl z-10 bg-slate-900 flex flex-col">
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

      {/* MODAL DE PRODUCTO */}
      {selectedProduct && (
        <ProductDispatcher
          selectedProduct={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onConfirm={(finalItem) => {
            addToCart(finalItem);
            setSelectedProduct(null);
            toast.success("Producto agregado");
          }}
          ingredients={ingredients}
          sides={sides}
          drinks={drinksCatalog.length ? drinksCatalog : config?.drinks || []}
          potatoes={potatoes}
          sauces={sauces}
          globalConfig={config}
        />
      )}

      {/* MODAL DE TICKET */}
      <TicketModal
        isOpen={showTicket}
        onClose={() => {
          setShowTicket(false);
          setPendingOrderData(null);
        }}
        onConfirm={handleConfirmOrder}
        ticketItems={ticketInfo.items}
        orderData={pendingOrderData || {}}
        currentOrderId={ticketInfo.orderId}
        currentOrderNumber={ticketInfo.orderNumber}
        loading={loadingOrder}
        tempQrId={Date.now()}
      />

      {/* HISTORIAL DE ÓRDENES */}
      <OrdersHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onReprint={handleReprint}
      />
    </div>
  );
}