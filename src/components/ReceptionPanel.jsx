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
  const { menuItems } = useMenu();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { saveOrder, loading: loadingOrder } = useOrders();
  const { config, loadingConfig } = useConfig();

  const [showTicket, setShowTicket] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState({ orderId: null, orderNumber: null, items: [] });

  const [ingredients, setIngredients] = useState([]);
  const [sides, setSides] = useState([]);
  const [drinksCatalog, setDrinksCatalog] = useState([]);
  const [potatoes, setPotatoes] = useState([]);
  const [sauces, setSauces] = useState([]);

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
    const mainCategory = (product.mainCategory || "").toLowerCase();
    const isPizza = mainCategory === "pizzas" || product.pizzaType === "Clasica" || product.pizzaType === "Especialidad";

    if (isPizza) {
      setSelectedProduct(product);
    } else {
      addToCart({ ...product, qty: 1 });
      toast.success("Producto agregado", { position: "bottom-center" });
    }
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
      const result = await saveOrder({ orderData: orderPayload, cartItems: cart });
      if (result) {
        setTicketInfo((prev) => ({ ...prev, orderId: result.id, orderNumber: result.number }));
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
    setTicketInfo({ orderId: order.id, orderNumber: order.number, items: order.itemsSnapshot || [] });
    setShowTicket(true);
    setShowHistory(false);
  };

  if (loadingConfig) {
    return <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-500 animate-pulse">Cargando...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
      
      {/* 1. AREA DE MENÚ: Ocupa el espacio restante (flex-1) */}
      <div className="flex-1 h-[60%] lg:h-full min-w-0">
        <MenuPanel
          menuItems={menuItems}
          onProductClick={handleProductClick}
          onLogout={onLogout}
          onHistory={() => setShowHistory(true)}
        />
      </div>

      {/* 2. AREA DE CARRITO: Ancho fijo en Tablet/PC, altura parcial en Móvil */}
      <div className="w-full lg:w-[420px] xl:w-[450px] h-[40%] lg:h-full border-t lg:border-t-0 lg:border-l border-slate-800 shadow-2xl z-20 bg-slate-900 flex flex-col relative">
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

      {/* MODALES (Flotantes) */}
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

      <OrdersHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onReprint={handleReprint}
      />
    </div>
  );
}