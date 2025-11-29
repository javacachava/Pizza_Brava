import React, { useState } from "react";
import { Toaster } from "react-hot-toast";

import { useMenu } from "./hooks/useMenu";
import { useCart } from "./hooks/useCart";
import { useOrders } from "./hooks/useOrders";
import { useConfig } from "./hooks/useConfig";

import MenuPanel from "./components/MenuPanel";
import CartPanel from "./components/CartPanel";
import TicketModal from "./components/TicketModal";
import ProductOptionsModal from "./components/ProductOptionsModal";

import { useAuth } from "./hooks/useAuth";
import Login from "./components/Login";
import ReceptionPanel from "./components/ReceptionPanel";
import KitchenDisplay from "./components/KitchenDisplay";
import AdminPanel from "./components/AdminPanel";
import NetworkStatus from "./components/NetworkStatus";

// IMPORTANTE: seed
import { seedDatabase } from "./scripts/seedDatabase";

export default function App() {
  const { user, role, loading, error, login, logout } = useAuth();

  // Estado para el seed
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");

  const handleSeedClick = async () => {
    try {
      setSeeding(true);
      setSeedMessage("Sembrando base de datos...");
      await seedDatabase();
      setSeedMessage("Seed completado correctamente.");
    } catch (e) {
      console.error("Error en seedDatabase:", e);
      setSeedMessage("Error al sembrar la base de datos. Revisa la consola.");
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedMessage(""), 5000);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 animate-pulse font-bold text-slate-400">
        Cargando sistema...
      </div>
    );
  }

  // 1. NO autenticado → solo Login
  if (!user) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <Login onLogin={login} error={error} />
      </>
    );
  }

  // 2. AUTENTICADO → router por rol
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "bold",
          },
          success: { style: { background: "#22c55e" } },
          error: { style: { background: "#ef4444" } },
        }}
      />

      {/* Solo se usa cuando hay usuario autenticado */}
      <NetworkStatus />

      {role === "recepcion" && <ReceptionPanel onLogout={logout} />}
      {role === "cocina" && <KitchenDisplay onLogout={logout} />}
      {role === "admin" && (
        <>
          <AdminPanel onLogout={logout} />

          {/* BOTÓN DE SEED SOLO PARA ADMIN (DEV) */}
          <button
            type="button"
            onClick={handleSeedClick}
            disabled={seeding}
            className="fixed bottom-3 right-3 text-[10px] px-3 py-1.5 rounded-md bg-slate-900 text-slate-100 opacity-40 hover:opacity-100 transition-opacity shadow-lg z-50"
          >
            {seeding ? "Seed..." : "Seed DB (dev)"}
          </button>

          {seedMessage && (
            <div className="fixed bottom-10 right-3 text-[11px] px-3 py-1.5 rounded-md bg-white/90 text-slate-700 shadow-lg z-50">
              {seedMessage}
            </div>
          )}
        </>
      )}

      {!["recepcion", "cocina", "admin"].includes(role) && (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-100">
          <h1 className="text-2xl font-bold text-red-600">Rol desconocido</h1>
          <button onClick={logout} className="text-blue-600 underline mt-4">
            Salir
          </button>
        </div>
      )}
    </>
  );
}
