import React, { useEffect, useState, useMemo } from "react";
import { X, Printer, Search, RefreshCw } from "lucide-react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

export default function OrdersHistoryModal({ isOpen, onClose, onReprint }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc"),
        limit(30)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setOrders(data);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const term = search.toLowerCase();
    return orders.filter((o) => {
      const numberStr = String(o.number ?? "").toLowerCase();
      const nameStr = String(o.customerName ?? "").toLowerCase();
      const phoneStr = String(o.customerPhone ?? "").toLowerCase();
      return (
        numberStr.includes(term) ||
        nameStr.includes(term) ||
        phoneStr.includes(term)
      );
    });
  }, [orders, search]);

  if (!isOpen) return null;

  const formatDateTime = (ts) => {
    try {
      const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
      if (!d) return "-";
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}`;
    } catch {
      return "-";
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center px-4 py-6"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-400">
              Historial
            </p>
            <h2 className="text-lg font-bold text-slate-50">
              Órdenes recientes
            </h2>
            <p className="text-xs text-slate-400">
              Últimas 30 órdenes guardadas en el sistema.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-start md:items-center bg-slate-950">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Buscar por # de orden, nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : undefined}
            />
            Actualizar
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-slate-950">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
              Cargando órdenes...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
              No hay órdenes para mostrar.
            </div>
          ) : (
            <table className="w-full text-sm text-slate-200">
              <thead className="bg-slate-900 border-b border-slate-800 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left">Orden</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Fecha/Hora</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-900/70 transition-colors"
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      #{order.number ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {order.customerName || "Cliente Mostrador"}
                        </span>
                        {order.customerPhone && (
                          <span className="text-[11px] text-slate-400">
                            {order.customerPhone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-300">
                      {order.orderType || "Mostrador"}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-300">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-bold">
                      ${Number(order.total || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => onReprint(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-100 hover:border-blue-300 hover:bg-slate-800 transition-colors"
                        title="Reimprimir"
                      >
                        <Printer size={14} />
                        Ticket
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
