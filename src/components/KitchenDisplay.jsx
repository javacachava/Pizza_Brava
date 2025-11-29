import React, { useEffect, useState, useRef, useMemo } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { useOrders } from "../hooks/useOrders";
import {
  LogOut,
  ChefHat,
  Bell,
  BellOff,
  Clock,
  CheckCircle,
  PackageCheck
} from "lucide-react";
import { STATUS } from "../constants/types";
import { NOTIFICATION_SOUND_BASE64 } from "../constants/assets";

export default function KitchenDisplay({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [now, setNow] = useState(Date.now());

  const { updateOrderStatus } = useOrders();

  const audioRef = useRef(null);
  const lastLatestTimeRef = useRef(null);

  // Reloj para recalcular tiempos en cocina
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Inicializar audio tras interacción del usuario
  const initAudio = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIFICATION_SOUND_BASE64);
        audioRef.current.load();
      }
      setAudioInitialized(true);
      setSoundEnabled(true);
    } catch (e) {
      console.error("Error inicializando audio:", e);
    }
  };

  const playNotification = () => {
    if (!audioInitialized || !soundEnabled || !audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (e) {
      console.error("Error reproduciendo sonido:", e);
    }
  };

  // Listener de órdenes
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        // solo nos interesan las que no están despachadas
        const active = list.filter(
          (o) =>
            o.status === STATUS.NEW ||
            o.status === STATUS.PROCESS ||
            o.status === STATUS.READY
        );

        setOrders(active);

        // detectar nuevas órdenes (según createdAt)
        const times = active
          .map((o) =>
            o.createdAt?.toDate
              ? o.createdAt.toDate().getTime()
              : o.createdAt instanceof Date
              ? o.createdAt.getTime()
              : null
          )
          .filter((t) => typeof t === "number");

        if (!times.length) return;

        const latest = Math.max(...times);

        if (lastLatestTimeRef.current == null) {
          // primera carga: no sonar
          lastLatestTimeRef.current = latest;
          return;
        }

        if (latest > lastLatestTimeRef.current) {
          lastLatestTimeRef.current = latest;
          playNotification();
        }
      },
      (error) => {
        console.error("Error en snapshot de cocina:", error);
      }
    );

    return () => unsub();
  }, [soundEnabled, audioInitialized]);

  const grouped = useMemo(() => {
    return {
      [STATUS.NEW]: orders.filter((o) => o.status === STATUS.NEW),
      [STATUS.PROCESS]: orders.filter((o) => o.status === STATUS.PROCESS),
      [STATUS.READY]: orders.filter((o) => o.status === STATUS.READY)
    };
  }, [orders]);

  const getMinutesInKitchen = (order) => {
    try {
      const d = order.createdAt?.toDate
        ? order.createdAt.toDate()
        : order.createdAt instanceof Date
        ? order.createdAt
        : null;
      if (!d) return null;
      const diffMs = now - d.getTime();
      return Math.max(0, Math.floor(diffMs / 60000));
    } catch {
      return null;
    }
  };

  const handleStatusChange = (order, nextStatus) => {
    if (!order?.id) return;
    updateOrderStatus(order.id, nextStatus);
  };

  // Pantalla inicial para habilitar audio (obligatorio por navegador)
  if (!audioInitialized) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-8 p-4 selection:bg-orange-500">
        <div className="relative">
          <div className="absolute -inset-6 bg-orange-500 rounded-full opacity-20 blur-2xl animate-pulse" />
          <ChefHat size={96} className="text-orange-400 relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            PANTALLA DE COCINA
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md">
            Toca el botón para activar el sistema de notificaciones sonoras
            cuando llegue una nueva orden.
          </p>
        </div>
        <button
          onClick={initAudio}
          className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-3 rounded-2xl font-bold text-lg shadow-xl shadow-orange-900/30 hover:scale-105 active:scale-95 transition-transform"
        >
          Iniciar pantalla de cocina
        </button>
        <button
          onClick={onLogout}
          className="mt-4 text-sm text-slate-400 hover:text-red-300 flex items-center gap-2"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center">
            <ChefHat size={22} className="text-orange-300" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-orange-400 font-bold">
              Cocina
            </p>
            <h1 className="text-lg font-bold">Órdenes en preparación</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Resumen */}
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold">
            <span className="px-2 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200">
              Nuevas:{" "}
              <span className="text-orange-400">{grouped[STATUS.NEW].length}</span>
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200">
              En proceso:{" "}
              <span className="text-yellow-300">
                {grouped[STATUS.PROCESS].length}
              </span>
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200">
              Listas:{" "}
              <span className="text-emerald-300">
                {grouped[STATUS.READY].length}
              </span>
            </span>
          </div>

          {/* Sonido */}
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${
              soundEnabled
                ? "bg-emerald-500/15 border-emerald-400 text-emerald-200"
                : "bg-slate-900 border-slate-700 text-slate-300"
            }`}
          >
            {soundEnabled ? (
              <>
                <Bell size={14} />
                Sonido ON
              </>
            ) : (
              <>
                <BellOff size={14} />
                Sonido OFF
              </>
            )}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-900/20 border border-red-700/60 text-red-200 hover:bg-red-800/50 hover:border-red-400 transition-colors"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>
      </header>

      {/* Columns */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-y-auto">
        <OrdersColumn
          title="Nuevas"
          color="orange"
          orders={grouped[STATUS.NEW]}
          onAdvance={(order) =>
            handleStatusChange(order, STATUS.PROCESS)
          }
          now={now}
          getMinutesInKitchen={getMinutesInKitchen}
        />
        <OrdersColumn
          title="En preparación"
          color="yellow"
          orders={grouped[STATUS.PROCESS]}
          onAdvance={(order) => handleStatusChange(order, STATUS.READY)}
          now={now}
          getMinutesInKitchen={getMinutesInKitchen}
        />
        <OrdersColumn
          title="Listas"
          color="emerald"
          orders={grouped[STATUS.READY]}
          onAdvance={(order) =>
            handleStatusChange(order, STATUS.DELIVERED)
          }
          now={now}
          getMinutesInKitchen={getMinutesInKitchen}
        />
      </main>
    </div>
  );
}

function OrdersColumn({
  title,
  color,
  orders,
  onAdvance,
  now,
  getMinutesInKitchen
}) {
  const colorClasses = {
    orange: {
      header: "text-orange-300",
      border: "border-orange-500/50",
      pill: "bg-orange-500/15 text-orange-100 border-orange-400/60",
      button:
        "bg-orange-500/90 hover:bg-orange-400 text-white shadow-orange-900/40"
    },
    yellow: {
      header: "text-yellow-300",
      border: "border-yellow-500/40",
      pill: "bg-yellow-500/10 text-yellow-100 border-yellow-400/60",
      button:
        "bg-yellow-400/90 hover:bg-yellow-300 text-slate-900 shadow-yellow-900/30"
    },
    emerald: {
      header: "text-emerald-300",
      border: "border-emerald-500/40",
      pill: "bg-emerald-500/10 text-emerald-100 border-emerald-400/60",
      button:
        "bg-emerald-500/90 hover:bg-emerald-400 text-slate-900 shadow-emerald-900/30"
    }
  }[color] || colorClasses?.orange;

  return (
    <section className="flex flex-col bg-slate-950 border border-slate-800 rounded-3xl shadow-md overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              color === "orange"
                ? "bg-orange-400"
                : color === "yellow"
                ? "bg-yellow-300"
                : "bg-emerald-400"
            }`}
          />
          <h2
            className={`text-xs font-bold uppercase tracking-[0.2em] ${colorClasses.header}`}
          >
            {title}
          </h2>
        </div>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full border ${colorClasses.pill}`}
        >
          {orders.length} orden(es)
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-[11px] text-slate-500">
            Sin órdenes en esta columna.
          </div>
        ) : (
          orders.map((order) => {
            const minutes = getMinutesInKitchen(order);
            const items = order.itemsSnapshot || [];

            return (
              <article
                key={order.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 px-3 py-2.5 text-xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-100">
                      #{order.number ?? "—"}
                    </span>
                    <span className="font-semibold text-slate-50">
                      {order.customerName || "Mostrador"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={12} />
                    {minutes != null ? `${minutes} min` : "—"}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2 space-y-1 max-h-24 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between gap-2 text-[11px] text-slate-200"
                    >
                      <span className="truncate">
                        {item.qty}× {item.name}
                      </span>
                      {item.details && item.details.length > 0 && (
                        <span className="text-[9px] text-slate-400 truncate">
                          {item.details.join(" • ")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono font-bold text-slate-100 text-[11px]">
                    ${Number(order.total || 0).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdvance(order)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-sm ${colorClasses.button}`}
                  >
                    {title === "Listas" ? (
                      <>
                        <PackageCheck size={13} />
                        Despachar
                      </>
                    ) : (
                      <>
                        <CheckCircle size={13} />
                        Avanzar
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
