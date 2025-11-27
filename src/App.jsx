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
import NetworkStatus from "./components/NetworkStatus"; // ✅ Importación añadida

export default function App() {
  const { user, role, loading, error, login, logout } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-100 animate-pulse font-bold text-slate-400">Cargando sistema...</div>;
  }

  // 1. Renderizado condicional de Login
  if (!user) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        {/* También podrías querer mostrar el NetworkStatus en el login si lo deseas */}
        <NetworkStatus /> 
        <Login onLogin={login} error={error} />
      </>
    );
  }

  // 2. Enrutador por Rol
  return (
    <>
      {/* EL TOASTER DEBE ESTAR AQUÍ PARA QUE FUNCIONE EN TODA LA APP */}
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
          },
          success: {
            style: { background: '#22c55e' },           },
          error: {
            style: { background: '#ef4444' }, 
          },
        }}
      />

      <NetworkStatus />

      {role === 'recepcion' && <ReceptionPanel onLogout={logout} />}
      {role === 'cocina' && <KitchenDisplay onLogout={logout} />}
      {role === 'admin' && <AdminPanel onLogout={logout} />}
      
      {/* Fallback para roles desconocidos */}
      {!['recepcion', 'cocina', 'admin'].includes(role) && (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-100">
          <h1 className="text-2xl font-bold text-red-600">Rol desconocido</h1>
          <button onClick={logout} className="text-blue-600 underline mt-4">Salir</button>
        </div>
      )}
    </>
  );
}