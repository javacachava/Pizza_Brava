import React, { useEffect, useState, useRef } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { useOrders } from "../hooks/useOrders";
import { CheckCircle, LogOut, ChefHat, Bell, PackageCheck, Play } from "lucide-react";
import { toast } from "react-hot-toast";
import { STATUS } from "../constants/types";
import { NOTIFICATION_SOUND_BASE64 } from "../constants/assets";

export default function KitchenDisplay({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const [tick, setTick] = useState(0); 
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const { updateOrderStatus } = useOrders();
  const audioRef = useRef(new Audio(NOTIFICATION_SOUND_BASE64));

  const initAudio = () => {
    audioRef.current.play().then(() => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioInitialized(true);
      setSoundEnabled(true);
    }).catch(e => {
      console.error("Error inicializando audio:", e);
      setAudioInitialized(true);
    });
  };

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("status", "in", [STATUS.NEW, STATUS.PROCESS, STATUS.READY]),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && change.doc.data().status === STATUS.NEW) {
            if (soundEnabled) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.log("Audio bloqueado"));
            } else {
                toast("¡Nueva Orden!", { icon: '🔔' });
            }
        }
      });
      setOrders(ordersData);
    });

    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, [soundEnabled]);

  const handleStatusChange = async (order) => {
    let nextStatus = STATUS.PROCESS;
    if (order.status === STATUS.NEW) nextStatus = STATUS.PROCESS;
    else if (order.status === STATUS.PROCESS) nextStatus = STATUS.READY;
    else if (order.status === STATUS.READY) nextStatus = STATUS.DELIVERED; 

    await updateOrderStatus(order.id, nextStatus);
  };

  const getUrgencyStyles = (timestamp, status) => {
    if (status === STATUS.READY) return "border-l-8 border-green-600 bg-green-50"; 
    if (!timestamp) return "border-l-8 border-slate-300 bg-white";
    
    const diffMinutes = (new Date() - timestamp.toDate()) / 1000 / 60;
    if (diffMinutes > 25) return "border-l-8 border-red-600 bg-red-50 animate-pulse"; 
    if (diffMinutes > 15) return "border-l-8 border-yellow-500 bg-yellow-50"; 
    return "border-l-8 border-blue-500 bg-white"; 
  };

  if (!audioInitialized) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-6 p-4">
        <ChefHat size={80} className="text-amber-500 animate-bounce"/>
        <h1 className="text-3xl font-bold text-center">Pantalla de Cocina</h1>
        <button 
          onClick={initAudio}
          className="bg-green-600 px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:scale-105 transition flex items-center gap-3 animate-pulse"
        >
          <Play size={24}/> INICIAR TURNO
        </button>
        <p className="text-slate-400 text-sm opacity-80 text-center max-w-md">
          Al hacer clic, se activarán las alertas sonoras para nuevas órdenes.
        </p>
      </div>
    );
  }

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
            const isReady = order.status === STATUS.READY;

            return (
            <div key={order.id} className={`rounded-xl overflow-hidden shadow-lg flex flex-col text-slate-900 h-full ${urgencyClass}`}>
                <div className={`p-3 border-b border-slate-200 flex justify-between items-center ${isReady ? 'bg-green-200' : 'bg-white/50'}`}>
                    <span className="font-black text-2xl">#{order.number}</span>
                    <div className="text-right">
                        <span className="text-[10px] font-bold uppercase block text-slate-500">{order.orderType || 'Mesa'}</span>
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
                                    <span className="bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded text-xs h-fit min-w-[24px] text-center">{item.qty}</span>
                                    <div className="leading-tight">
                                        <p className="font-bold text-slate-800">{item.name}</p>
                                        {item.details?.length > 0 && (
                                            <p className="text-[11px] text-slate-600 italic">{item.details.join(", ")}</p>
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
                        order.status === STATUS.NEW ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 
                        order.status === STATUS.PROCESS ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                        'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {order.status === STATUS.NEW && <>Empezar <ChefHat size={18}/></>}
                    {order.status === STATUS.PROCESS && <>Marcar Listo <CheckCircle size={18}/></>}
                    {order.status === STATUS.READY && <>Entregar <PackageCheck size={18}/></>}
                </button>
            </div>
            );
        })}
      </div>
    </div>
  );
}