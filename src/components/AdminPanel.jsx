import React, { useState, useEffect } from "react";
import { LogOut, Save, Plus, Settings, Pizza, Users, BarChart2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useConfig } from "../hooks/useConfig";
import AnalyticsPanel from "./AnalyticsPanel"; // <--- IMPORTAR EL NUEVO MÓDULO

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState("analytics"); // Default: Reportes
  const { config, loadingConfig } = useConfig();
  
  // ... (resto de estados para config global: ingredients, drinks, etc) ...
  const [ingredients, setIngredients] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [sides, setSides] = useState([]);
  const [prices, setPrices] = useState({ extraIngredient: 0, sizeDifference: 0 });

  useEffect(() => {
    if (config) {
      setIngredients(config.ingredients || []);
      setDrinks(config.drinks || []);
      setSides(config.sides || []);
      setPrices({
        extraIngredient: config.rules?.ingredientPrice || 0,
        sizeDifference: config.rules?.sizes?.Grande?.priceModifier || 0
      });
    }
  }, [config]);

  const handleSaveGlobalConfig = async () => {
    try {
      const docRef = doc(db, "configuration", "global_options");
      await updateDoc(docRef, {
        ingredients, drinks, sides,
        prices: {
          extraIngredient: parseFloat(prices.extraIngredient),
          sizeDifference: parseFloat(prices.sizeDifference)
        }
      });
      alert("Guardado!");
    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    }
  };

  // Componente auxiliar ListEditor (igual que antes)
  const ListEditor = ({ title, items, setItems }) => {
    const [val, setVal] = useState("");
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h4 className="font-bold text-xs uppercase text-slate-500 mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2 mb-2">
          {items.map((item, i) => (
            <span key={i} className="bg-slate-100 px-2 py-1 rounded text-xs flex items-center gap-1">
              {item} <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-500 font-bold">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="border p-1 rounded text-sm flex-1" value={val} onChange={e => setVal(e.target.value)} placeholder="Nuevo..." />
          <button onClick={() => { if(val.trim()) { setItems([...items, val.trim()]); setVal(""); } }} className="bg-blue-600 text-white p-1 rounded"><Plus size={16}/></button>
        </div>
      </div>
    );
  };

  if (loadingConfig) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="text-amber-400" /> Administración
        </h1>
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setActiveTab('analytics')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab==='analytics' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
               <BarChart2 size={16} className="inline mr-1"/> Reportes
            </button>
            <button onClick={() => setActiveTab('config')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab==='config' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
               Configuración Global
            </button>
            {/* Tabs futuros: Productos, Usuarios */}
        </div>
        <button onClick={onLogout} className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-1">
          <LogOut size={16} /> Salir
        </button>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {/* VISTA: REPORTES Y ANÁLISIS */}
        {activeTab === 'analytics' && <AnalyticsPanel />}

        {/* VISTA: CONFIGURACIÓN GLOBAL */}
        {activeTab === 'config' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Variables del Sistema</h2>
                <button onClick={handleSaveGlobalConfig} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg flex gap-2 items-center">
                    <Save size={18}/> Guardar Cambios
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100">
                        <h3 className="font-bold text-slate-700 mb-4 flex gap-2 items-center"><Pizza size={18} className="text-amber-500"/> Precios Base</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo Extra Ingrediente</label>
                                <div className="relative"><span className="absolute left-3 top-2 text-slate-400">$</span><input type="number" className="w-full pl-6 border p-2 rounded font-bold" value={prices.extraIngredient} onChange={e => setPrices({...prices, extraIngredient: e.target.value})} /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Extra Pizza Gigante</label>
                                <div className="relative"><span className="absolute left-3 top-2 text-slate-400">$</span><input type="number" className="w-full pl-6 border p-2 rounded font-bold" value={prices.sizeDifference} onChange={e => setPrices({...prices, sizeDifference: e.target.value})} /></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <ListEditor title="Ingredientes Pizza" items={ingredients} setItems={setIngredients} />
                    <ListEditor title="Opciones Bebidas (Combos)" items={drinks} setItems={setDrinks} />
                    <ListEditor title="Opciones Acompañamientos" items={sides} setItems={setSides} />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}