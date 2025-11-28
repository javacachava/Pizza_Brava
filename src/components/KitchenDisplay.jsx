import React, { useEffect, useState, useRef } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { useOrders } from "../hooks/useOrders";
import { Clock, CheckCircle, LogOut, ChefHat, AlertTriangle, Bell, PackageCheck } from "lucide-react";
import { toast } from "react-hot-toast";

// Sonido "Ding" embebido para no depender de archivos externos
const NOTIFICATION_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEIyAAAAjqZAANQAACqv/9D//8z///4n//5w/wH+B/8//4HgAAAAAiAAAD//OEJAAABuyqUAAAAA4AAAA0AAAAPAAAA8AAAA4////+H////gAAAAA//OEJAAABqyiUAAAAA4AAAA0AAAAPAAAA8AAAA4////+H////gAAAAA//OEJAAABwSiUAAAAA4AAAA0AAAAPAAAA8AAAA4////+H////gAAAAA//OEJAAAB2CiUAAAAA4AAAA0AAAAPAAAA8AAAA4////+H////gAAAAA";

export default function KitchenDisplay({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const [tick, setTick] = useState(0); 
  const { updateOrderStatus } = useOrders();
  const audioRef = useRef(new Audio(NOTIFICATION_SOUND));
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    // Escuchar Nuevos, En Proceso y Listos
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["nuevo", "proceso", "listo"]),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Reproducir sonido solo si hay órdenes nuevas añadidas
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && change.doc.data().status === 'nuevo') {
            if (soundEnabled) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.log("Interacción requerida para audio"));
            } else {
                toast("¡Nueva Orden!", { icon: '🔔' });
            }
        }
      });

      setOrders(ordersData);
    });

    const timer = setInterval(() => setTick(t => t + 1), 30000); // Actualizar colores cada 30s

    return () => { unsubscribe(); clearInterval(timer); };
  }, [soundEnabled]);

  const handleStatusChange = async (order) => {
    let nextStatus = "proceso";
    if (order.status === "nuevo") nextStatus = "proceso";
    else if (order.status === "proceso") nextStatus = "listo";
    else if (order.status === "listo") nextStatus = "despachado"; // Desaparece de pantalla

    await updateOrderStatus(order.id, nextStatus);
  };

  const getUrgencyStyles = (timestamp, status) => {
    if (status === 'listo') return "border-l-8 border-green-600 bg-green-50"; 
    
    if (!timestamp) return "border-l-8 border-slate-300 bg-white";
    const now = new Date();
    const orderTime = timestamp.toDate();
    const diffMinutes = (now - orderTime) / 1000 / 60;

    if (diffMinutes > 25) return "border-l-8 border-red-600 bg-red-50 animate-pulse"; 
    if (diffMinutes > 15) return "border-l-8 border-yellow-500 bg-yellow-50"; 
    return "border-l-8 border-blue-500 bg-white"; 
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <ChefHat size={32} className="text-amber-500"/> Cocina
        </h1>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-2 px-3 py-2 rounded font-bold text-xs ${soundEnabled ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
                <Bell size={16} /> {soundEnabled ? "Sonido ON" : "Sonido OFF"}
            </button>
            <button onClick={onLogout} className="bg-slate-700 p-2 rounded hover:bg-slate-600">
                <LogOut size={20}/>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {orders.length === 0 && (
            <div className="col-span-full text-center py-20 opacity-50">
                <ChefHat size={64} className="mx-auto mb-4"/>
                <p className="text-xl">Sin órdenes pendientes</p>
            </div>
        )}

        {orders.map(order => {
            const urgencyClass = getUrgencyStyles(order.createdAt, order.status);
            const isReady = order.status === 'listo';

            return (
            <div key={order.id} className={`rounded-xl overflow-hidden shadow-lg flex flex-col text-slate-900 h-full ${urgencyClass}`}>
                <div className={`p-3 border-b border-slate-200 flex justify-between items-center ${isReady ? 'bg-green-200' : 'bg-white/50'}`}>
                    <span className="font-black text-2xl">#{order.number}</span>
                    <div className="text-right">
                        <span className="text-[10px] font-bold uppercase block text-slate-500">
                            {order.orderType || 'Mesa'}
                        </span>
                        <span className="text-xs font-mono font-bold">
                            {order.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                </div>
                
                <div className="p-3 flex-1 bg-white/80 space-y-3">
                    <ul className="space-y-2">
                        {order.itemsSnapshot?.map((item, idx) => (
                            <li key={idx} className="text-sm border-b border-slate-100 pb-1 last:border-0">
                                <div className="flex gap-2">
                                    <span className="bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded text-xs h-fit min-w-[24px] text-center">
                                        {item.qty}
                                    </span>
                                    <div className="leading-tight">
                                        <p className="font-bold text-slate-800">{item.name}</p>
                                        {item.details?.length > 0 && (
                                            <p className="text-[11px] text-slate-600 italic">
                                                {item.details.join(", ")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {order.orderNotes && (
                        <div className="bg-yellow-100 p-2 rounded text-xs font-bold text-yellow-800 border-l-4 border-yellow-500">
                            Nota: {order.orderNotes}
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => handleStatusChange(order)}
                    className={`w-full py-4 font-bold text-sm uppercase flex justify-center items-center gap-2 transition-colors mt-auto ${
                        order.status === 'nuevo' ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 
                        order.status === 'proceso' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                        'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {order.status === 'nuevo' && <>Empezar <ChefHat size={18}/></>}
                    {order.status === 'proceso' && <>Marcar Listo <CheckCircle size={18}/></>}
                    {order.status === 'listo' && <>Entregar <PackageCheck size={18}/></>}
                </button>
            </div>
            );
        })}
      </div>
    </div>
  );
}