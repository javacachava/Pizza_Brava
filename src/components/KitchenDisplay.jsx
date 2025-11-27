import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { useOrders } from "../hooks/useOrders";
import { Clock, CheckCircle, LogOut, ChefHat, AlertTriangle } from "lucide-react";

export default function KitchenDisplay({ onLogout }) {
  const [orders, setOrders] = useState([]);
  // Estado para forzar re-render cada minuto y actualizar los colores del semáforo
  const [tick, setTick] = useState(0); 
  const { updateOrderStatus } = useOrders();

  useEffect(() => {
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

    // Timer para actualizar los colores cada 30 segundos
    const timer = setInterval(() => setTick(t => t + 1), 30000);

    return () => {
        unsubscribe();
        clearInterval(timer);
    };
  }, []);

  const handleAdvanceOrder = async (order) => {
    const nextStatus = order.status === "nuevo" ? "proceso" : "listo";
    await updateOrderStatus(order.id, nextStatus);
  };

  // --- LÓGICA DEL SEMÁFORO ---
  const getUrgencyStyles = (timestamp) => {
    if (!timestamp) return "border-l-8 border-slate-300 bg-white";
    
    const now = new Date();
    const orderTime = timestamp.toDate(); // Convertir Timestamp de Firebase a Date
    const diffMinutes = (now - orderTime) / 1000 / 60;

    if (diffMinutes > 25) {
        return "border-l-8 border-red-600 bg-red-50 animate-pulse shadow-red-200"; // CRÍTICO
    }
    if (diffMinutes > 15) {
        return "border-l-8 border-yellow-500 bg-yellow-50"; // ALERTA
    }
    return "border-l-8 border-green-500 bg-white"; // A TIEMPO
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ChefHat size={32} className="text-amber-500"/> Pantalla de Cocina
        </h1>
        <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 flex gap-3">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> A tiempo</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> +15min</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div> +25min</span>
            </div>
            <button onClick={onLogout} className="bg-slate-700 p-2 rounded hover:bg-slate-600">
                <LogOut size={20}/>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {orders.map(order => {
            const urgencyClass = getUrgencyStyles(order.createdAt);
            const isCritical = urgencyClass.includes("red");

            return (
            <div key={order.id} className={`rounded-xl overflow-hidden shadow-lg transition-all duration-500 text-slate-900 ${urgencyClass}`}>
                <div className={`p-4 border-b border-slate-200 flex justify-between items-center ${isCritical ? 'bg-red-100' : 'bg-opacity-50'}`}>
                    <span className="font-black text-2xl">#{order.number}</span>
                    <div className="flex flex-col items-end">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                            order.status === 'nuevo' ? 'bg-blue-200 text-blue-800' : 'bg-orange-200 text-orange-800'
                        }`}>
                            {order.status}
                        </span>
                        {isCritical && <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1"><AlertTriangle size={10}/> ATRASADO</span>}
                    </div>
                </div>
                
                <div className="p-4 space-y-4">
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        <Clock size={14}/>
                        {order.createdAt?.seconds 
                            ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                            : '...'}
                    </p>
                    
                    {/* LISTA DE PRODUCTOS */}
                    <div className="space-y-2">
                        {order.itemsSnapshot?.map((item, idx) => (
                            <div key={idx} className="border-b border-slate-200 pb-2 last:border-0">
                                <p className="font-bold text-sm">
                                    <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-xs mr-1">{item.qty}</span> 
                                    {item.name}
                                </p>
                                {(item.details || (item.ingredients && item.ingredients.length > 0)) && (
                                    <div className="text-xs text-slate-600 pl-7 mt-1">
                                        {item.details?.map((d, i) => <div key={i}>• {d}</div>)}
                                        {item.ingredients?.length > 0 && (
                                            <div className="italic text-slate-500">Ing: {item.ingredients.join(", ")}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Notas */}
                    {order.orderNotes && (
                        <div className="bg-yellow-100 p-2 rounded border border-yellow-200 text-xs italic text-yellow-800 font-medium">
                            Nota: "{order.orderNotes}"
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => handleAdvanceOrder(order)}
                    className={`w-full py-4 text-center font-bold text-sm uppercase hover:brightness-95 transition-colors flex justify-center items-center gap-2 ${
                        order.status === 'nuevo' ? 'bg-slate-200 text-slate-700' : 'bg-green-600 text-white'
                    }`}
                >
                    {order.status === 'nuevo' ? 'Empezar' : 'Listo para Servir'} 
                    {order.status === 'nuevo' ? <ChefHat size={16}/> : <CheckCircle size={16}/>}
                </button>
            </div>
            );
        })}

        {orders.length === 0 && (
            <div className="col-span-full text-center py-32 text-slate-600">
                <div className="inline-block p-6 rounded-full bg-slate-800 mb-4">
                    <Clock size={48} className="text-amber-500"/>
                </div>
                <p className="text-2xl font-light text-slate-400">Todo está tranquilo en la cocina...</p>
            </div>
        )}
      </div>
    </div>
  );
}