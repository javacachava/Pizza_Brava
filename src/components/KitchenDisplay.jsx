import React, { useEffect, useState, useRef } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { useOrders } from "../hooks/useOrders";
import { CheckCircle, LogOut, ChefHat, Bell, PackageCheck, Play, Clock, Flame } from "lucide-react";
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

  const getUrgencyColor = (timestamp, status) => {
    if (status === STATUS.READY) return "emerald"; 
    if (!timestamp) return "blue";
    
    const diffMinutes = (new Date() - timestamp.toDate()) / 1000 / 60;
    if (diffMinutes > 25) return "red"; 
    if (diffMinutes > 15) return "yellow"; 
    return "blue"; 
  };

  if (!audioInitialized) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-8 p-4 selection:bg-orange-500">
        <div className="relative">
            <div className="absolute -inset-4 bg-orange-600 rounded-full opacity-20 blur-xl animate-pulse"></div>
            <ChefHat size={100} className="text-orange-500 relative z-10"/>
        </div>
        <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tight">KDS SYSTEM</h1>
            <p className="text-slate-400 text-lg">Pantalla de Cocina Inteligente</p>
        </div>
        <button 
          onClick={initAudio}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-10 py-5 rounded-2xl font-bold text-xl shadow-xl shadow-green-900/20 hover:scale-105 transition-all flex items-center gap-3"
        >
          <Play size={28} fill="currentColor"/> INICIAR TURNO
        </button>
        <p className="text-slate-500 text-xs opacity-60 max-w-xs text-center">
          Al hacer clic, se habilitarán los permisos de audio para notificaciones de nuevas órdenes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm sticky top-4 z-50 shadow-2xl">
        <h1 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
          <div className="bg-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-600/20"><ChefHat size={32} className="text-white"/></div>
          KDS <span className="text-slate-500 font-medium text-lg hidden sm:inline">| Cocina Principal</span>
        </h1>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${soundEnabled ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
            >
                <Bell size={16} className={soundEnabled ? "fill-current" : ""} /> {soundEnabled ? "Sonido ON" : "Silencio"}
            </button>
            <button onClick={onLogout} className="bg-slate-800 p-2.5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-colors border border-slate-700">
                <LogOut size={20}/>
            </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {orders.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-600 space-y-4 opacity-50">
                <Flame size={80} className="animate-pulse"/>
                <p className="text-2xl font-black uppercase tracking-widest">Todo Tranquilo</p>
            </div>
        )}

        {orders.map(order => {
            const color = getUrgencyColor(order.createdAt, order.status);
            // Mapa de colores Tailwind dinámico
            const borderColors = {
                emerald: "border-emerald-500", red: "border-red-500", yellow: "border-yellow-500", blue: "border-blue-500"
            };
            const shadowColors = {
                emerald: "shadow-emerald-500/20", red: "shadow-red-500/20", yellow: "shadow-yellow-500/20", blue: "shadow-blue-500/20"
            };

            return (
            <div key={order.id} className={`
                relative flex flex-col h-full
                rounded-2xl border-l-[6px] ${borderColors[color]} 
                bg-slate-900 border-y border-r border-slate-800 
                shadow-2xl ${shadowColors[color]} overflow-hidden group hover:border-slate-700 transition-all duration-300
            `}>
                {/* Header Tarjeta */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-start bg-slate-800/30">
                    <div>
                        <span className="font-black text-4xl text-white tracking-tighter">#{order.number}</span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest bg-slate-800 px-2 py-0.5 rounded w-fit">
                            {order.orderType || 'Mesa'}
                        </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                         {/* Timer simulado */}
                         <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            <Clock size={12}/>
                            {order.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>
                
                {/* Items */}
                <div className="p-5 flex-1 space-y-4 overflow-y-auto max-h-[300px]">
                    {order.itemsSnapshot?.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                             {/* Cantidad */}
                            <span className="bg-slate-800 text-white font-black text-lg min-w-[36px] h-[36px] flex items-center justify-center rounded-lg border border-slate-700 shadow-inner">
                                {item.qty}
                            </span>
                            <div className="leading-snug pt-0.5">
                                <p className="font-bold text-lg text-slate-200">{item.name}</p>
                                {item.details?.length > 0 && (
                                    <p className="text-sm text-orange-400/80 italic mt-1 font-medium">
                                        + {item.details.join(", ")}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {order.orderNotes && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl mt-4">
                            <p className="text-yellow-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Nota de Cocina</p>
                            <p className="text-yellow-200 text-sm font-medium italic leading-relaxed">"{order.orderNotes}"</p>
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                <div className="p-3 bg-slate-900 border-t border-slate-800">
                    <button 
                        onClick={() => handleStatusChange(order)}
                        className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest shadow-lg transform active:scale-95 transition-all flex justify-center items-center gap-3
                            ${order.status === STATUS.NEW ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700' : 
                              order.status === STATUS.PROCESS ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' :
                              'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'}
                        `}
                    >
                        {order.status === STATUS.NEW && <><Flame size={20} /> Cocinar</>}
                        {order.status === STATUS.PROCESS && <><CheckCircle size={20} /> Listo</>}
                        {order.status === STATUS.READY && <><PackageCheck size={20} /> Despachar</>}
                    </button>
                </div>
            </div>
            );
        })}
      </div>
    </div>
  );
}