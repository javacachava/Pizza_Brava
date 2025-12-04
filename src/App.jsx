import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";

// --- Imports correctos ---
import { StatusBar } from "@capacitor/status-bar";
import { NavigationBar } from "capacitor-navigation-bar"; // <--- CORRECTO
import { Capacitor } from "@capacitor/core";
// ---------------------------

import { useAuth } from "./hooks/useAuth";
import Login from "./components/Login";
import ReceptionPanel from "./components/ReceptionPanel";
import KitchenDisplay from "./components/KitchenDisplay";
import AdminPanel from "./components/AdminPanel";
import NetworkStatus from "./components/NetworkStatus";

export default function App() {
  const { user, role, loading, error, login, logout } = useAuth();

  // Ejecutar solo cuando corre como app nativa
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const hideBars = async () => {
        try {
          await StatusBar.hide(); // Oculta barra superior

          // Oculta barra inferior con plugin compatible con Capacitor 7
          await NavigationBar.setVisibility({ visible: false });
        } catch (err) {
          console.error("Error ocultando barras:", err);
        }
      };

      hideBars();
    }
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 animate-pulse font-bold text-slate-400">
        Cargando sistema...
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <Login onLogin={login} error={error} />
      </>
    );
  }

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

      <NetworkStatus />

      {role === "recepcion" && <ReceptionPanel onLogout={logout} />}
      {role === "cocina" && <KitchenDisplay onLogout={logout} />}
      {role === "admin" && <AdminPanel onLogout={logout} />}

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
