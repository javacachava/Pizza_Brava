import React, { useState, useEffect } from "react";
import { 
  LogOut, Save, Plus, Trash2, Settings, Pizza, Users, 
  BarChart2, Edit, Check, X as XIcon, ToggleLeft, ToggleRight 
} from "lucide-react";
import { 
  doc, updateDoc, collection, addDoc, deleteDoc, getDocs 
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useConfig } from "../hooks/useConfig";
import AnalyticsPanel from "./AnalyticsPanel";

// Categorías disponibles para el dropdown
const CATEGORY_OPTIONS = [
  "Pizzas", "Bebidas", "Hamburguesas", "Birrias", "Platos", "Entradas", "Complementos"
];

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState("menu"); 
  const { config, loadingConfig } = useConfig();
  
  // --- ESTADOS GESTIÓN MENÚ ---
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Formulario de Producto (Estado Inicial)
  const initialFormState = {
    id: null,
    name: "",
    price: "",
    mainCategory: "Pizzas",
    station: "cocina",
    isActive: true,
    // Configuración especial
    isClassic: false, // Para pizzas clásicas (tamaños)
    isCombo: false,   // Para combos (bebida + entrada)
    comboHasDrink: true,
    comboHasSide: true
  };
  
  const [formData, setFormData] = useState(initialFormState);

  // --- ESTADOS CONFIG GLOBAL ---
  const [ingredients, setIngredients] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [sides, setSides] = useState([]);
  const [prices, setPrices] = useState({ extraIngredient: 0, sizeDifference: 0 });

  // Cargar Configuración Global
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

  // Cargar Productos al entrar a la pestaña Menú
  useEffect(() => {
    if (activeTab === "menu") {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const querySnapshot = await getDocs(collection(db, "menuItems"));
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar alfabéticamente
      items.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(items);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // --- HANDLERS MENÚ (CRUD) ---

  const handleOpenForm = (product = null) => {
    if (product) {
      // Cargar datos para editar
      setFormData({
        id: product.id,
        name: product.name,
        price: product.price,
        mainCategory: product.mainCategory,
        station: product.station || "cocina",
        isActive: product.isActive !== false,
        isClassic: product.pizzaType === "Clasica",
        isCombo: !!product.comboOptions,
        comboHasDrink: product.comboOptions?.hasDrink || false,
        comboHasSide: product.comboOptions?.hasSide || false
      });
    } else {
      // Resetear para nuevo
      setFormData(initialFormState);
    }
    setIsEditing(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) return alert("Nombre y Precio obligatorios");

    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      mainCategory: formData.mainCategory,
      station: formData.station,
      isActive: formData.isActive,
      // Lógica especial
      pizzaType: formData.isClassic ? "Clasica" : "Normal",
      comboOptions: formData.isCombo ? {
        hasDrink: formData.comboHasDrink,
        hasSide: formData.comboHasSide,
        // Usamos listas globales por defecto, pero podrías personalizarlas aquí si quisieras
        drinkChoices: [], 
        sideChoices: []
      } : null
    };

    try {
      if (formData.id) {
        // Editar existente
        await updateDoc(doc(db, "menuItems", formData.id), productData);
        alert("Producto actualizado");
      } else {
        // Crear nuevo
        await addDoc(collection(db, "menuItems"), productData);
        alert("Producto creado");
      }
      setIsEditing(false);
      fetchProducts(); // Recargar lista
    } catch (error) {
      console.error(error);
      alert("Error al guardar producto");
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await updateDoc(doc(db, "menuItems", product.id), {
        isActive: !product.isActive
      });
      // Actualizar localmente rápido
      setProducts(products.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };

  const handleDeleteProduct = async (id) => {
    if(!window.confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.")) return;
    try {
      await deleteDoc(doc(db, "menuItems", id));
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  // --- HANDLERS CONFIG GLOBAL ---
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
      alert("Configuración Global Guardada!");
    } catch (error) {
      alert("Error al guardar configuración.");
    }
  };

  // Componente auxiliar ListEditor
  const ListEditor = ({ title, items, setItems }) => {
    const [val, setVal] = useState("");
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="font-bold text-xs uppercase text-slate-500 mb-3 flex justify-between">
            {title} <span className="bg-slate-100 px-2 rounded text-slate-600">{items.length}</span>
        </h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {items.map((item, i) => (
            <span key={i} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs flex items-center gap-1 text-slate-700">
              {item} <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 font-bold ml-1"><XIcon size={12}/></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="border p-2 rounded text-sm flex-1 outline-none focus:border-amber-500" value={val} onChange={e => setVal(e.target.value)} placeholder="Agregar nuevo..." />
          <button onClick={() => { if(val.trim()) { setItems([...items, val.trim()]); setVal(""); } }} className="bg-amber-600 text-white p-2 rounded hover:bg-amber-700"><Plus size={16}/></button>
        </div>
      </div>
    );
  };

  if (loadingConfig) return <div className="h-screen flex items-center justify-center text-slate-500">Cargando Panel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navbar Superior */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-md gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="text-amber-400" /> Admin Panel
        </h1>
        
        {/* Menú de Pestañas */}
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg overflow-x-auto">
            <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab==='menu' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
               <Pizza size={16}/> Menú
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab==='analytics' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
               <BarChart2 size={16}/> Reportes
            </button>
            <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab==='config' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
               <Settings size={16}/> Configuración
            </button>
        </div>

        <button onClick={onLogout} className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-1">
          <LogOut size={16} /> Salir
        </button>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        
        {/* --- VISTA: GESTIÓN DE MENÚ --- */}
        {activeTab === 'menu' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Inventario de Productos</h2>
                    <button onClick={() => handleOpenForm()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow">
                        <Plus size={18}/> Nuevo Producto
                    </button>
                </div>

                {/* Modal de Edición/Creación */}
                {isEditing && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                                <h3 className="font-bold text-lg">{formData.id ? "Editar Producto" : "Crear Nuevo Producto"}</h3>
                                <button onClick={() => setIsEditing(false)} className="hover:bg-white/10 p-1 rounded"><XIcon size={20}/></button>
                            </div>
                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                                        <input type="text" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Pizza Pepperoni"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Precio Base ($)</label>
                                        <input type="number" className="w-full border p-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Categoría</label>
                                        <select className="w-full border p-2 rounded bg-white" value={formData.mainCategory} onChange={e => setFormData({...formData, mainCategory: e.target.value})}>
                                            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Estación</label>
                                        <select className="w-full border p-2 rounded bg-white" value={formData.station} onChange={e => setFormData({...formData, station: e.target.value})}>
                                            <option value="cocina">Cocina</option>
                                            <option value="barra">Barra</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 space-y-3">
                                    <p className="text-sm font-bold text-slate-700">Configuración Avanzada</p>
                                    
                                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-blue-600" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                                        <span className="text-sm font-medium">Producto Activo (Disponible para venta)</span>
                                    </label>

                                    {formData.mainCategory === "Pizzas" && (
                                        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-amber-50 cursor-pointer border-amber-100">
                                            <input type="checkbox" className="w-5 h-5 text-amber-600" checked={formData.isClassic} onChange={e => setFormData({...formData, isClassic: e.target.checked})} />
                                            <div>
                                                <span className="block text-sm font-bold text-amber-900">Es Pizza Clásica</span>
                                                <span className="text-xs text-amber-700">Activa selector de tamaño y 2 ingredientes obligatorios.</span>
                                            </div>
                                        </label>
                                    )}

                                    {(formData.mainCategory === "Platos" || formData.mainCategory === "Hamburguesas") && (
                                        <div className="p-3 border rounded-lg bg-slate-50 space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4" checked={formData.isCombo} onChange={e => setFormData({...formData, isCombo: e.target.checked})} />
                                                <span className="text-sm font-bold">Es un Combo</span>
                                            </label>
                                            {formData.isCombo && (
                                                <div className="ml-6 space-y-2">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={formData.comboHasDrink} onChange={e => setFormData({...formData, comboHasDrink: e.target.checked})} />
                                                        Incluye Bebida (Selector)
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={formData.comboHasSide} onChange={e => setFormData({...formData, comboHasSide: e.target.checked})} />
                                                        Incluye Entrada (Selector)
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-end gap-2 border-t border-slate-200">
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancelar</button>
                                <button onClick={handleSaveProduct} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Guardar Producto</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lista de Productos */}
                {loadingProducts ? (
                    <p className="text-center text-slate-500">Cargando inventario...</p>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-3">Producto</th>
                                    <th className="px-6 py-3">Categoría</th>
                                    <th className="px-6 py-3">Precio</th>
                                    <th className="px-6 py-3 text-center">Estado</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {product.name}
                                            {product.pizzaType === "Clasica" && <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Clásica</span>}
                                            {product.comboOptions && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Combo</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{product.mainCategory}</td>
                                        <td className="px-6 py-4 font-mono font-bold">${product.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleToggleActive(product)} className={`transition-colors ${product.isActive !== false ? 'text-green-600' : 'text-slate-300'}`}>
                                                {product.isActive !== false ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleOpenForm(product)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )}

        {/* --- VISTA: REPORTES --- */}
        {activeTab === 'analytics' && <AnalyticsPanel />}

        {/* --- VISTA: CONFIGURACIÓN GLOBAL --- */}
        {activeTab === 'config' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Configuración Global</h2>
                    <p className="text-slate-500 text-sm">Define ingredientes y precios base que aplican a todos los productos.</p>
                </div>
                <button onClick={handleSaveGlobalConfig} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 shadow-lg flex gap-2 items-center">
                    <Save size={18}/> Guardar Globales
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100">
                        <h3 className="font-bold text-slate-700 mb-4 flex gap-2 items-center"><Pizza size={18} className="text-amber-500"/> Reglas de Precio</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo Ingrediente Extra</label>
                                <div className="relative"><span className="absolute left-3 top-2 text-slate-400">$</span><input type="number" className="w-full pl-6 border p-2 rounded font-bold text-slate-700" value={prices.extraIngredient} onChange={e => setPrices({...prices, extraIngredient: e.target.value})} /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Extra Pizza Gigante</label>
                                <div className="relative"><span className="absolute left-3 top-2 text-slate-400">$</span><input type="number" className="w-full pl-6 border p-2 rounded font-bold text-slate-700" value={prices.sizeDifference} onChange={e => setPrices({...prices, sizeDifference: e.target.value})} /></div>
                                <p className="text-[10px] text-slate-400 mt-1">Se suma al precio base si es Gigante.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <ListEditor title="Ingredientes para Pizzas" items={ingredients} setItems={setIngredients} />
                    <ListEditor title="Opciones de Bebidas (Combos)" items={drinks} setItems={setDrinks} />
                    <ListEditor title="Opciones de Entradas (Combos)" items={sides} setItems={setSides} />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}