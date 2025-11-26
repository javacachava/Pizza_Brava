import React from "react";
import { LogOut, Settings } from "lucide-react";

export default function AdminPanel({ onLogout }) {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Settings className="text-blue-600"/> Panel de Administración
        </h1>
        <button onClick={onLogout} className="bg-white p-2 rounded shadow hover:bg-slate-50 text-red-600">
            <LogOut /> Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sección Menú */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Gestión del Menú</h2>
            <p className="text-slate-500 mb-4">Agrega, edita o elimina pizzas y combos.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">
                Administrar Productos
            </button>
        </div>

        {/* Sección Configuración Global */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Configuración Global</h2>
            <p className="text-slate-500 mb-4">Edita precios de extras, lista de ingredientes y sodas.</p>
            <button className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900">
                Editar Globales
            </button>
        </div>
      </div>
    </div>
  );
}