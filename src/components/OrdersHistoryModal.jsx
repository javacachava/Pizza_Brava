import React, { useEffect, useState } from "react";
import { X, Printer, Search, RefreshCw } from "lucide-react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../services/firebase"; // Asegúrate de que este archivo existe en src/services/

export default function OrdersHistoryModal({ isOpen, onClose, onReprint }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc"),
        limit(15) // Limitamos a 15 para optimizar lecturas
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    } catch (error) {
      console.error("Error historial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchOrders();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg flex gap-2 items-center">
            <Search size={20}/> Últimas Órdenes
          </h3>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><X size={20}/></button>
        </div>

        <div className="p-2 border-b bg-slate-50 flex justify-end">
            <button onClick={fetchOrders} className="text-sm text-blue-600 flex items-center gap-1 hover:underline p-2">
                <RefreshCw size={14}/> Actualizar
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Cargando historial...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-500 uppercase font-bold text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold">#{order.number}</td>
                    <td className="px-4 py-3 text-slate-500">
                        {order.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-4 py-3 font-medium">
                        {order.customerName}
                        <span className="block text-[10px] text-slate-400">{order.orderType}</span>
                    </td>
                    <td className="px-4 py-3 font-mono">${order.total?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            order.status === 'nuevo' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'listo' ? 'bg-green-100 text-green-700' :
                            order.status === 'despachado' ? 'bg-gray-100 text-gray-500 line-through' :
                            'bg-orange-100 text-orange-700'
                        }`}>
                            {order.status}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                        <button 
                            onClick={() => onReprint(order)}
                            className="text-slate-600 hover:text-blue-600 p-1 rounded border border-transparent hover:border-blue-200"
                            title="Reimprimir Ticket"
                        >
                            <Printer size={16}/>
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}