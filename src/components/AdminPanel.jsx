import React, { useState, useEffect } from "react";
import { 
  LogOut, Save, Plus, Trash2, Settings, Pizza, Users, 
  BarChart2, Edit, X as XIcon, ToggleLeft, ToggleRight, UserX, UserCheck, Shield, Key 
} from "lucide-react";
import { 
  doc, updateDoc, collection, addDoc, deleteDoc, getDocs, setDoc 
} from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
// ✅ IMPORTAMOS LA CONFIGURACIÓN CENTRALIZADA
import { db, firebaseConfig } from "../services/firebase";
import { useConfig } from "../hooks/useConfig";
import AnalyticsPanel from "./AnalyticsPanel";
import { toast } from "react-hot-toast";

const CATEGORY_OPTIONS = [
  "Pizzas", "Bebidas", "Hamburguesas", "Birrias", "Platos", "Entradas", "Complementos"
];

// ✅ OPTIMIZACIÓN: Componente extraído fuera para evitar re-renderizados lentos
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
        <input className="border p-2 rounded text-sm flex-1 outline-none focus:border-amber-500" value={val} onChange={e => setVal(e.target.value)} placeholder="Agregar..." />
        <button onClick={() => { if(val.trim()) { setItems([...items, val.trim()]); setVal(""); } }} className="bg-amber-600 text-white p-2 rounded hover:bg-amber-700"><Plus size={16}/></button>
      </div>
    </div>
  );
};

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState("analytics"); 
  const { config, loadingConfig } = useConfig();
  
  // --- ESTADOS MENÚ ---
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialFormState = {
    id: null,
    name: "",
    price: "",
    stock: "", 
    mainCategory: "Pizzas",
    station: "cocina",
    isActive: true,
    isClassic: false,
    isCombo: false,
    comboHasDrink: true,
    comboHasSide: true
  };
  
  const [formData, setFormData] = useState(initialFormState);

  // --- ESTADOS USUARIOS ---
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "recepcion" });

  // --- ESTADOS CONFIG GLOBAL ---
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

  useEffect(() => {
    if (activeTab === "menu") fetchProducts();
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  // --- LOGICA PRODUCTOS ---
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const q = await getDocs(collection(db, "menuItems"));
      const items = q.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(items);
    } catch (e) { console.error(e); }
    finally { setLoadingProducts(false); }
  };

  const handleOpenForm = (product = null) => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock !== undefined && product.stock !== null ? product.stock : "",
        mainCategory: product.mainCategory,
        station: product.station || "cocina",
        isActive: product.isActive !== false,
        isClassic: product.pizzaType === "Clasica",
        isCombo: !!product.comboOptions,
        comboHasDrink: product.comboOptions?.hasDrink || false,
        comboHasSide: product.comboOptions?.hasSide || false
      });
    } else {
      setFormData(initialFormState);
    }
    setIsEditing(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name?.trim()) return toast.error("El nombre es obligatorio");
    
    const priceVal = parseFloat(formData.price);
    // ✅ VALIDACIÓN CORREGIDA: Precio debe ser > 0
    if (isNaN(priceVal) || priceVal <= 0) return toast.error("El precio debe ser mayor a $0.00");

    const productData = {
      name: formData.name.trim(),
      price: priceVal,
      stock: formData.stock !== "" ? parseInt(formData.stock) : null,
      mainCategory: formData.mainCategory,
      station: formData.station,
      isActive: formData.isActive,
      pizzaType: formData.isClassic ? "Clasica" : "Normal",
      comboOptions: formData.isCombo ? {
        hasDrink: formData.comboHasDrink,
        hasSide: formData.comboHasSide,
        drinkChoices: [], 
        sideChoices: []
      } : null
    };

    const toastId = toast.loading("Guardando producto...");

    try {
      if (formData.id) {
        await updateDoc(doc(db, "menuItems", formData.id), productData);
        toast.success("Producto actualizado", { id: toastId });
      } else {
        await addDoc(collection(db, "menuItems"), productData);
        toast.success("Producto creado", { id: toastId });
      }
      setIsEditing(false);
      fetchProducts();
    } catch (e) { 
        console.error(e);
        toast.error("Error al guardar: " + e.message, { id: toastId });
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await updateDoc(doc(db, "menuItems", product.id), { isActive: !product.isActive });
      setProducts(products.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
    } catch (e) { console.error(e); }
  };

  const handleDeleteProduct = async (id) => {
    if(!window.confirm("¿Eliminar este producto permanentemente?")) return;
    try {
      await deleteDoc(doc(db, "menuItems", id));
      setProducts(products.filter(p => p.id !== id));
      toast.success("Producto eliminado");
    } catch (e) { 
      // ✅ MEJORA: Log detallado para depuración
      console.error("Error al eliminar producto:", e);
      toast.error("Error al eliminar. Revisa la consola."); 
    }
  };

  // --- LOGICA USUARIOS ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const q = await getDocs(collection(db, "users"));
      const userList = q.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        active: doc.data().active ?? true 
      }));
      setUsers(userList);
    } catch (e) { console.error(e); }
    finally { setLoadingUsers(false); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newUser.password.length < 6) return toast.error("Contraseña muy corta (min 6)");

    const toastId = toast.loading("Registrando usuario...");
    // ✅ Usamos la config importada
    const secondaryApp = initializeApp(firebaseConfig, "Secondary");
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
        const uid = userCredential.user.uid;

        await setDoc(doc(db, "users", uid), {
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            active: true,
            createdAt: new Date()
        });

        await signOut(secondaryAuth);
        deleteApp(secondaryApp);

        toast.success(`Usuario ${newUser.name} creado`, { id: toastId });
        setIsCreatingUser(false);
        setNewUser({ name: "", email: "", password: "", role: "recepcion" });
        fetchUsers();

    } catch (error) {
        console.error("Error creando usuario:", error);
        let msg = "Error al crear usuario";
        if (error.code === 'auth/email-already-in-use') msg = "El correo ya existe";
        toast.error(msg, { id: toastId });
    }
  };

  const toggleUserStatus = async (user) => {
    if (user.role === 'admin') return alert("No puedes desactivar a un administrador.");
    const newStatus = !user.active;
    if (!window.confirm(`¿${newStatus ? 'Reactivar' : 'Bloquear'} a ${user.name}?`)) return;

    try {
      await updateDoc(doc(db, "users", user.id), { active: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
    } catch (e) { alert("Error actualizando usuario."); }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === 'admin') return alert("No puedes eliminar a un administrador.");
    if (!window.confirm(`¿Eliminar permanentemente a ${user.name}?`)) return;

    try {
        await deleteDoc(doc(db, "users", user.id));
        setUsers(users.filter(u => u.id !== user.id));
        alert("Usuario eliminado.");
    } catch (e) { alert("Error al eliminar."); }
  };

  // --- LOGICA GLOBAL ---
  const handleSaveGlobalConfig = async () => {
    const toastId = toast.loading("Guardando configuración...");
    try {
      const docRef = doc(db, "configuration", "global_options");
      await updateDoc(docRef, {
        ingredients, drinks, sides,
        prices: {
          extraIngredient: parseFloat(prices.extraIngredient),
          sizeDifference: parseFloat(prices.sizeDifference)
        }
      });
      toast.success("Configuración Global Guardada", { id: toastId });
    } catch (e) { 
        toast.error("Error al guardar", { id: toastId }); 
    }
  };

  if (loadingConfig) return <div className="h-screen flex items-center justify-center">Cargando Panel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-md gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="text-amber-400" /> Admin Panel
        </h1>
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg overflow-x-auto">
            <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab==='analytics' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
               <BarChart2 size={16}/> Reportes
            </button>
            <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab==='menu' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
               <Pizza size={16}/> Menú
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab==='users' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
               <Users size={16}/> Usuarios
            </button>
            <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab==='config' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
               <Settings size={16}/> Config
            </button>
        </div>
        <button onClick={onLogout} className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-1">
          <LogOut size={16} /> Salir
        </button>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        
        {activeTab === 'analytics' && <AnalyticsPanel />}

        {activeTab === 'menu' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Inventario</h2>
                    <button onClick={() => handleOpenForm()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow">
                        <Plus size={18}/> Nuevo Producto
                    </button>
                </div>

                {isEditing && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                                <h3 className="font-bold text-lg">{formData.id ? "Editar" : "Nuevo"}</h3>
                                <button onClick={() => setIsEditing(false)} className="hover:bg-white/10 p-1 rounded"><XIcon size={20}/></button>
                            </div>
                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nombre *</label>
                                        <input type="text" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Pizza..."/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Precio ($) *</label>
                                        <input type="number" className="w-full border p-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/>
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
                                        <label className="text-xs font-bold text-slate-500 uppercase">Stock</label>
                                        <input type="number" className="w-full border p-2 rounded" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="Ilimitado"/>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 space-y-3">
                                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-blue-600" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                                        <span className="text-sm font-medium">Activo para venta</span>
                                    </label>

                                    {formData.mainCategory === "Pizzas" && (
                                        <label className="flex items-center gap-3 p-3 border rounded-lg bg-amber-50 border-amber-100 cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5 text-amber-600" checked={formData.isClassic} onChange={e => setFormData({...formData, isClassic: e.target.checked})} />
                                            <div>
                                                <span className="block text-sm font-bold text-amber-900">Pizza Clásica</span>
                                                <span className="text-xs text-amber-700">Habilita selector de tamaño.</span>
                                            </div>
                                        </label>
                                    )}

                                    {(formData.mainCategory === "Platos" || formData.mainCategory === "Hamburguesas") && (
                                        <div className="p-3 border rounded-lg bg-slate-50 space-y-2">
                                            <label className="flex items-center gap-2 font-bold text-sm cursor-pointer">
                                                <input type="checkbox" checked={formData.isCombo} onChange={e => setFormData({...formData, isCombo: e.target.checked})} /> Es Combo
                                            </label>
                                            {formData.isCombo && (
                                                <div className="ml-6 flex gap-4 text-sm">
                                                    <label><input type="checkbox" checked={formData.comboHasDrink} onChange={e => setFormData({...formData, comboHasDrink: e.target.checked})} /> Bebida</label>
                                                    <label><input type="checkbox" checked={formData.comboHasSide} onChange={e => setFormData({...formData, comboHasSide: e.target.checked})} /> Entrada</label>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-end gap-2 border-t border-slate-200">
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancelar</button>
                                <button onClick={handleSaveProduct} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabla Productos */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-3">Nombre</th>
                                    <th className="px-6 py-3">Precio</th>
                                    <th className="px-6 py-3">Stock</th>
                                    <th className="px-6 py-3 text-center">Estado</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {p.name}
                                            {p.pizzaType === "Clasica" && <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Clásica</span>}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold">${p.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-slate-500">{p.stock !== null && p.stock !== undefined ? p.stock : '∞'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleToggleActive(p)} className={p.isActive !== false ? 'text-green-600' : 'text-slate-300'}>
                                                {p.isActive !== false ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleOpenForm(p)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Gestión de Personal</h2>
                    <button onClick={() => setIsCreatingUser(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow">
                        <Plus size={18}/> Registrar Usuario
                    </button>
                </div>

                {isCreatingUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Registrar Empleado</h3>
                                <button onClick={() => setIsCreatingUser(false)} className="hover:bg-white/10 p-1 rounded"><XIcon size={20}/></button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                                    <div className="relative"><Users className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                    <input required type="text" className="w-full pl-9 border p-2 rounded" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}/></div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Correo</label>
                                    <input required type="email" className="w-full border p-2 rounded" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Contraseña</label>
                                    <div className="relative"><Key className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                    <input required type="password" className="w-full pl-9 border p-2 rounded" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}/></div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Rol</label>
                                    <select className="w-full border p-2 rounded bg-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                        <option value="recepcion">Recepción (Cajero)</option>
                                        <option value="cocina">Cocina (Pantalla)</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex gap-2">
                                    <button type="button" onClick={() => setIsCreatingUser(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded hover:bg-slate-200">Cancelar</button>
                                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Crear Usuario</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.map(user => (
                        <div key={user.id} className={`bg-white p-5 rounded-xl shadow-sm border flex justify-between items-center ${user.active === false ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-full ${user.active === false ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {user.role === 'admin' ? <Shield size={20}/> : user.role === 'cocina' ? <Pizza size={20}/> : <Users size={20}/>}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{user.name || "Usuario"}</h4>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                    <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-600 mt-1 inline-block">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                            
                            {user.role !== 'admin' && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => toggleUserStatus(user)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                            user.active === false 
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        }`}
                                    >
                                        {user.active === false ? <UserCheck size={14}/> : <UserX size={14}/>}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(user)}
                                        className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 flex items-center"
                                        title="Eliminar permanentemente"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Configuración Global</h2>
                <button onClick={handleSaveGlobalConfig} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 shadow-lg flex gap-2 items-center">
                    <Save size={18}/> Guardar
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100">
                        <h3 className="font-bold text-slate-700 mb-4 flex gap-2 items-center"><Pizza size={18} className="text-amber-500"/> Precios Base</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-slate-500 uppercase">Ingrediente Extra</label><input type="number" className="w-full border p-2 rounded font-bold" value={prices.extraIngredient} onChange={e => setPrices({...prices, extraIngredient: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase">Extra Gigante</label><input type="number" className="w-full border p-2 rounded font-bold" value={prices.sizeDifference} onChange={e => setPrices({...prices, sizeDifference: e.target.value})} /></div>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <ListEditor title="Ingredientes Pizza" items={ingredients} setItems={setIngredients} />
                    <ListEditor title="Sodas (Combos)" items={drinks} setItems={setDrinks} />
                    <ListEditor title="Entradas (Combos)" items={sides} setItems={setSides} />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}