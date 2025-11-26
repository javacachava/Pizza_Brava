import React, { useState, useEffect } from "react";
import { LogOut, Save, Plus, Trash, Settings, Pizza, Users } from "lucide-react";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../services/firebase";
import { useConfig } from "../hooks/useConfig";

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState("config"); // 'menu' | 'config' | 'users'
  
  // Hook que ya creamos para traer la data
  const { config, loadingConfig } = useConfig();
  
  // Estados locales para edición de Configuración Global
  const [ingredients, setIngredients] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [sides, setSides] = useState([]);
  const [prices, setPrices] = useState({ extraIngredient: 0, sizeDifference: 0 });

  // Cargar datos cuando bajen de Firebase
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

  // --- LOGICA DE GUARDADO GLOBAL ---
  const handleSaveGlobalConfig = async () => {
    try {
      const docRef = doc(db, "configuration", "global_options");
      await updateDoc(docRef, {
        ingredients: ingredients,
        drinks: drinks,
        sides: sides,
        prices: {
          extraIngredient: parseFloat(prices.extraIngredient),
          sizeDifference: parseFloat(prices.sizeDifference)
        }
      });
      alert("¡Configuración Global Guardada!");
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Error al guardar. Revisa permisos.");
    }
  };

  // Componente simple para editar listas (Ingredientes, Sodas, etc.)
  const ListEditor = ({ title, items, setItems }) => {
    const [newItem, setNewItem] = useState("");
    const add = () => {
      if (newItem.trim()) {
        setItems([...items, newItem.trim()]);
        setNewItem("");
      }
    };
    const remove = (idx) => {
      setItems(items.filter((_, i) => i !== idx));
    };

    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
        <h3 className="font-bold text-slate-700 mb-2 uppercase text-xs tracking-wider">{title}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {items.map((item, idx) => (
            <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm flex items-center gap-1">
              {item}
              <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600"><X size={12}/></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            className="border p-1 rounded text-sm flex-1" 
            placeholder={`Nuevo ${title}...`}
            value={newItem} onChange={e => setNewItem(e.target.value)}
          />
          <button onClick={add} className="bg-blue-600 text-white p-1 rounded"><Plus size={16}/></button>
        </div>
      </div>
    );
  };

  // Componente X icon auxiliar
  const X = ({size}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );

  if (loadingConfig) return <div className="p-10">Cargando panel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Superior */}
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="text-amber-400" /> Panel Administrador
        </h1>
        <div className="flex gap-4">
            <button onClick={() => setActiveTab('menu')} className={`px-3 py-1 rounded-lg text-sm font-medium transition ${activeTab==='menu' ? 'bg-amber-600' : 'hover:bg-white/10'}`}>Menú</button>
            <button onClick={() => setActiveTab('config')} className={`px-3 py-1 rounded-lg text-sm font-medium transition ${activeTab==='config' ? 'bg-amber-600' : 'hover:bg-white/10'}`}>Configuración Global</button>
            <button onClick={() => setActiveTab('users')} className={`px-3 py-1 rounded-lg text-sm font-medium transition ${activeTab==='users' ? 'bg-amber-600' : 'hover:bg-white/10'}`}>Usuarios</button>
        </div>
        <button onClick={onLogout} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm font-bold">
          <LogOut size={16} /> Salir
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
        
        {/* VISTA: CONFIGURACIÓN GLOBAL */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Variables del Sistema</h2>
                <button onClick={handleSaveGlobalConfig} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg">
                    <Save size={18}/> Guardar Cambios
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Precios Globales */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Pizza size={18} className="text-amber-500"/> Reglas de Precios
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo Ingrediente Extra ($)</label>
                            <input 
                                type="number" step="0.01"
                                className="w-full border p-2 rounded font-mono font-bold text-lg"
                                value={prices.extraIngredient}
                                onChange={e => setPrices({...prices, extraIngredient: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diferencia Precio (Personal -> Gigante) ($)</label>
                            <input 
                                type="number" step="0.01"
                                className="w-full border p-2 rounded font-mono font-bold text-lg"
                                value={prices.sizeDifference}
                                onChange={e => setPrices({...prices, sizeDifference: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Listas Maestras */}
                <div className="space-y-4">
                    <ListEditor title="Ingredientes Disponibles" items={ingredients} setItems={setIngredients} />
                    <ListEditor title="Sodas para Combos" items={drinks} setItems={setDrinks} />
                    <ListEditor title="Entradas para Combos" items={sides} setItems={setSides} />
                </div>
            </div>
          </div>
        )}

        {/* VISTA: GESTIÓN DE MENÚ (Placeholder) */}
        {activeTab === 'menu' && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <Pizza size={48} className="mx-auto text-slate-300 mb-4"/>
                <h3 className="text-xl font-bold text-slate-600">Gestión de Productos</h3>
                <p className="text-slate-400 mb-6">Aquí iría el formulario CRUD para agregar/editar las pizzas y combos individuales.</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Agregar Nuevo Producto</button>
            </div>
        )}

        {/* VISTA: USUARIOS (Placeholder) */}
        {activeTab === 'users' && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <Users size={48} className="mx-auto text-slate-300 mb-4"/>
                <h3 className="text-xl font-bold text-slate-600">Control de Acceso</h3>
                <p className="text-slate-400">Aquí puedes crear usuarios para Cocina o Recepción.</p>
            </div>
        )}

      </div>
    </div>
  );
}