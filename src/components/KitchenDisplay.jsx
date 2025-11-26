import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { useOrders } from "../hooks/useOrders";
import { Clock, CheckCircle, LogOut } from "lucide-react";

export default function KitchenDisplay({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const { updateOrderStatus } = useOrders();

  useEffect(() => {
    // Escuchar órdenes que NO estén terminadas
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["nuevo", "proceso"]),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const handleAdvanceOrder = async (order) => {
    const nextStatus = order.status === "nuevo" ? "proceso" : "listo";
    await updateOrderStatus(order.id, nextStatus);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ChefHat size={32} className="text-amber-500"/> Pantalla de Cocina
        </h1>
        <button onClick={onLogout} className="bg-slate-700 p-2 rounded hover:bg-slate-600">
            <LogOut />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {orders.map(order => (
          <div key={order.id} className={`rounded-xl overflow-hidden shadow-lg border-l-8 ${
            order.status === 'nuevo' ? 'bg-white text-slate-900 border-green-500' : 'bg-amber-100 text-slate-900 border-amber-500'
          }`}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-opacity-50">
              <span className="font-black text-2xl">#{order.number}</span>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-200">
                {order.status}
              </span>
            </div>
            
            <div className="p-4 space-y-4">
                {/* Aquí idealmente harías un fetch de los items de la subcolección, 
                    pero para eficiencia, te sugiero guardar un resumen de items en el documento padre de la orden también
                    o hacer un componente <OrderItems orderId={order.id} /> que los busque.
                    
                    Por ahora, asumiremos que guardas un array 'itemsSummary' en la orden para mostrar rápido.
                */}
                <p className="text-sm text-slate-500">
                    {new Date(order.createdAt?.seconds * 1000).toLocaleTimeString()}
                </p>
            </div>

            <button 
                onClick={() => handleAdvanceOrder(order)}
                className="w-full py-4 text-center font-bold text-sm uppercase hover:bg-black/5 transition-colors flex justify-center items-center gap-2"
            >
                {order.status === 'nuevo' ? 'Empezar' : 'Terminar'} 
                {order.status === 'nuevo' ? <Clock size={16}/> : <CheckCircle size={16}/>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}