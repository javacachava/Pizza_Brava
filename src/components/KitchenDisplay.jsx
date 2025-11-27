import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { useOrders } from "../hooks/useOrders";
// CORRECCIÓN AQUÍ: Agregado ChefHat a los imports
import { Clock, CheckCircle, LogOut, ChefHat } from "lucide-react";

export default function KitchenDisplay({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const { updateOrderStatus } = useOrders();

  useEffect(() => {
    // Escuchar órdenes que NO estén terminadas (nuevo o proceso)
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
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                  order.status === 'nuevo' ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'
              }`}>
                {order.status}
              </span>
            </div>
            
            <div className="p-4 space-y-4">
                <p className="text-sm text-slate-500 font-medium">
                    {order.createdAt?.seconds 
                        ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                        : 'Hora pendiente...'}
                </p>
                
                {/* LISTA DE PRODUCTOS PARA COCINA */}
                <div className="space-y-2">
                    {order.itemsSnapshot?.map((item, idx) => (
                        <div key={idx} className="border-b border-slate-200 pb-2 last:border-0">
                            <p className="font-bold text-sm">
                                <span className="bg-slate-800 text-white px-1.5 rounded text-xs mr-1">{item.qty}</span> 
                                {item.name}
                            </p>
                            {/* Mostrar detalles de preparación */}
                            {(item.details || (item.ingredients && item.ingredients.length > 0)) && (
                                <div className="text-xs text-slate-600 pl-6 mt-1">
                                    {item.details?.map((d, i) => <div key={i}>• {d}</div>)}
                                    {item.ingredients?.length > 0 && (
                                        <div className="italic text-slate-500">Ing: {item.ingredients.join(", ")}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Notas de la orden */}
                {order.orderNotes && (
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200 text-xs italic text-yellow-800">
                        " {order.orderNotes} "
                    </div>
                )}
            </div>

            <button 
                onClick={() => handleAdvanceOrder(order)}
                className={`w-full py-4 text-center font-bold text-sm uppercase hover:brightness-95 transition-colors flex justify-center items-center gap-2 ${
                    order.status === 'nuevo' ? 'bg-slate-100 text-slate-700' : 'bg-green-600 text-white'
                }`}
            >
                {order.status === 'nuevo' ? 'Empezar Preparación' : 'Terminar Orden'} 
                {order.status === 'nuevo' ? <Clock size={16}/> : <CheckCircle size={16}/>}
            </button>
          </div>
        ))}

        {orders.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500">
                <Clock size={48} className="mx-auto mb-4 opacity-20"/>
                <p className="text-xl font-light">No hay órdenes pendientes</p>
            </div>
        )}
      </div>
    </div>
  );
}