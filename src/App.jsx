import React from "react";
import { useAuth } from "./hooks/useAuth";
import Login from "./components/Login";
import ReceptionPanel from "./components/ReceptionPanel";
import KitchenDisplay from "./components/KitchenDisplay";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const { user, role, loading, error, login, logout } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-100">Cargando sistema...</div>;
  }

  // 1. Si no hay usuario, mostrar Login
  if (!user) {
    return <Login onLogin={login} error={error} />;
  }

  // 2. Si hay usuario, enrutar según Rol
  switch (role) {
    case 'recepcion':
      return <ReceptionPanel onLogout={logout} />;
    
    case 'cocina':
      return <KitchenDisplay onLogout={logout} />;
    
    case 'admin':
      return <AdminPanel onLogout={logout} />;
      
    default:
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-100">
          <h1 className="text-2xl font-bold text-red-600">Rol desconocido</h1>
          <p className="text-slate-600 mb-4">Tu usuario no tiene permisos asignados.</p>
          <button onClick={logout} className="text-blue-600 underline">Salir</button>
        </div>
      );
  }
}