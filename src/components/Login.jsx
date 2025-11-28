import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { ChefHat, ArrowRight, Lock, User } from "lucide-react";

// Imagen de fondo de alta calidad (Pizzería oscura)
const BG_IMAGE = "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop";

export default function Login({ onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">
      {/* Fondo con Overlay Oscuro */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      </div>

      {/* Tarjeta Glassmorphism */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/5 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center mb-10">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-5 rounded-full shadow-lg shadow-orange-500/30 mb-5 animate-bounce-slow">
                <ChefHat size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-2">
              PIZZA <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">BRAVA</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium text-sm uppercase tracking-widest">Sistema de Gestión POS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm text-center font-medium backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Correo Electrónico</label>
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-orange-400 transition-colors" size={20} />
              <input
                type="email"
                required
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="usuario@pizzabrava.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-orange-400 transition-colors" size={20} />
              <input
                type="password"
                required
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/40 transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group mt-4"
          >
            INGRESAR
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </form>
        
        <div className="mt-8 text-center">
            <p className="text-slate-600 text-xs">© 2024 Pizza Brava Enterprise</p>
        </div>
      </div>
    </div>
  );
}