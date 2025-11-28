import React, { useState, useEffect } from "react";
import { LogOut, Plus, Trash2, Settings, Edit, X as XIcon, UserCheck, UserX, LayoutGrid } from "lucide-react"; // LayoutGrid icon added
import { doc, updateDoc, collection, addDoc, deleteDoc, getDocs, setDoc, query, where, getCountFromServer } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, firebaseConfig } from "../services/firebase";
import { useConfig } from "../hooks/useConfig";
import { useOrders } from "../hooks/useOrders";
import AnalyticsPanel from "./AnalyticsPanel";
import AdminCombos from "./admin/AdminCombos"; // IMPORTANTE: Importar el componente de Combos
import { toast } from "react-hot-toast";
import { ROLES } from "../constants/types";

// ... (Componente ListEditor se mantiene igual, omitido por brevedad, asegúrate de mantenerlo si estaba en el archivo original o pégalo aquí)
const ListEditor = ({ title, items, setItems }) => {
  const [val, setVal] = useState("");
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h4 className="font-black text-xs uppercase text-slate-400 mb-4 flex justify-between tracking-widest">
        {title} <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{items.length}</span>
      </h4>
      <div className="flex-1 content-start flex flex-wrap gap-2 mb-4 overflow-y-auto max-h-48">
        {items.map((item, i) => (
            <span key={i} className="bg-slate-50 border border-slate-200 pl-3 pr-1 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 text-slate-700 group hover:border-orange-200 hover:bg-orange-50 transition-colors">
                {item} 
                <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 p-1 rounded-md hover:bg-white transition-all"><XIcon size={14}/></button>
            </span>
        ))}
      </div>
      <div className="flex gap-2 border-t border-slate-100 pt-4">
          <input className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm flex-1 outline-none focus:ring-2 focus:ring-orange-500 transition-all" value={val} onChange={e => setVal(e.target.value)} placeholder="Nuevo item..." />
          <button onClick={() => { if(val.trim()) { setItems([...items, val.trim()]); setVal(""); } }} className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-lg transition-colors"><Plus size={18}/></button>
      </div>
    </div>
  );
};

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState("analytics"); 
  const { config, loadingConfig } = useConfig();
  const { archiveOldOrders } = useOrders();
  
  // ... (useEffect para checkOldData se mantiene igual)
  useEffect(() => {
    const checkOldData = async () => {
        if(sessionStorage.getItem("checked_archive")) return;
        const limitDate = new Date(); limitDate.setDate(limitDate.getDate() - 90);
        try {
            const q = query(collection(db, "orders"), where("createdAt", "<", limitDate));
            const snapshot = await getCountFromServer(q);
            if (snapshot.data().count > 0) {
                if(window.confirm(`MANTENIMIENTO:\nHay ${snapshot.data().count} órdenes antiguas.\n¿Archivar?`)) {
                    const count = await archiveOldOrders(); toast.success(`${count} archivadas.`);
                }
            }
            sessionStorage.setItem("checked_archive", "true");
        } catch (e) { console.error("Error mantenimiento", e); }
    };
    checkOldData();
  }, []); // Agregado array de dependencias vacío para corregir warning si existía

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const initialFormState = { id: null, name: "", price: "", stock: "", mainCategory: "Pizzas", station: ROLES.KITCHEN, isActive: true, isClassic: false, isCombo: false, comboHasDrink: true, comboHasSide: true };
  const [formData, setFormData] = useState(initialFormState);
  const [users, setUsers] = useState([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: ROLES.RECEPTION });
  const [ingredients, setIngredients] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [sides, setSides] = useState([]); 
  const [prices, setPrices] = useState({ extraIngredient: 0, sizeDifference: 0 });

  useEffect(() => {
    if (config) {
      setIngredients(config.ingredients || []); setDrinks(config.drinks || []); setSides(config.sides || []);
      setPrices({ extraIngredient: config.rules?.ingredientPrice || 0, sizeDifference: config.rules?.sizes?.Grande?.priceModifier || 0 });
    }
  }, [config]);

  useEffect(() => {
    if (activeTab === "menu") fetchProducts();
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const q = await getDocs(collection(db, "menuItems"));
    // Excluimos los que son tipo 'combo' de la lista general de productos simples si quieres administrarlos solo en la pestaña combos
    // O puedes dejarlos aquí. Por limpieza, sugiero dejarlos si la lógica de edición simple les aplica, o filtrarlos si AdminCombos es muy diferente.
    // Aquí asumo que mostramos todo pero editamos simples aquí.
    setProducts(q.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.name.localeCompare(b.name)));
    setLoadingProducts(false);
  };
  
  // ... (Resto de funciones: handleOpenForm, handleSaveProduct, fetchUsers, handleCreateUser, toggleUserStatus, handleDeleteUser, handleSaveGlobalConfig se mantienen IGUALES)
  // Asegúrate de copiar las funciones del archivo original que no estoy modificando explícitamente si las necesitas.
  // Por brevedad, asumo que tienes el código original y solo insertas las partes nuevas.
  // A continuación pongo el JSX modificado del return.

  const handleOpenForm = (p) => { setFormData(p ? {...p, stock: p.stock ?? ""} : initialFormState); setIsEditing(true); };

  const handleSaveProduct = async () => {
      if (!formData.name?.trim()) return toast.error("Nombre obligatorio");
      const pData = { ...formData, price: parseFloat(formData.price), stock: formData.stock !== "" ? parseInt(formData.stock) : null };
      try {
        formData.id ? await updateDoc(doc(db, "menuItems", formData.id), pData) : await addDoc(collection(db, "menuItems"), pData);
        toast.success("Producto Guardado"); setIsEditing(false); fetchProducts();
      } catch (e) { toast.error(e.message); }
  };

  const fetchUsers = async () => {
      const q = await getDocs(collection(db, "users"));
      setUsers(q.docs.map(doc => ({ id: doc.id, active: true, ...doc.data() })));
  };

  const handleCreateUser = async (e) => {
      e.preventDefault();
      const secondaryApp = initializeApp(firebaseConfig, "Secondary");
      try {
          const cred = await createUserWithEmailAndPassword(getAuth(secondaryApp), newUser.email, newUser.password);
          await setDoc(doc(db, "users", cred.user.uid), { email: newUser.email, name: newUser.name, role: newUser.role, active: true });
          await signOut(getAuth(secondaryApp)); deleteApp(secondaryApp);
          toast.success("Usuario creado"); setIsCreatingUser(false); fetchUsers();
      } catch (error) { toast.error("Error creando usuario"); }
  };

  const toggleUserStatus = async (user) => {
      if (user.role === ROLES.ADMIN) return toast.error("No se puede bloquear a un admin");
      const newStatus = !user.active;
      try {
          await updateDoc(doc(db, "users", user.id), { active: newStatus });
          toast.success(`Usuario ${newStatus ? 'Activado' : 'Bloqueado'}`);
          fetchUsers();
      } catch (e) { toast.error("Error al actualizar estado"); }
  };

  const handleDeleteUser = async (user) => {
      if (user.role === ROLES.ADMIN) return toast.error("No se pueden eliminar administradores.");
      if(window.confirm(`¿Eliminar a ${user.name}?`)) { 
          try { await deleteDoc(doc(db, "users", user.id)); fetchUsers(); toast.success("Usuario eliminado"); } 
          catch(e){ toast.error("Error al eliminar"); } 
      }
  };

  const handleSaveGlobalConfig = async () => {
      try {
        await updateDoc(doc(db, "configuration", "global_options"), { ingredients, drinks, sides, prices: { extraIngredient: parseFloat(prices.extraIngredient), sizeDifference: parseFloat(prices.sizeDifference) } });
        toast.success("Configuración guardada");
      } catch (e) { toast.error("Error al guardar"); }
  };

  if (loadingConfig) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">Cargando Panel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navbar */}
      <div className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-lg z-20">
        <h1 className="text-xl font-black flex gap-3 items-center tracking-tight">
            <div className="bg-orange-600 p-1.5 rounded-lg"><Settings size={20} className="text-white" /></div>
            ADMIN PANEL
        </h1>
        
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
            {['analytics', 'menu', 'combos', 'users', 'config'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)} 
                    className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                    {tab === 'analytics' ? 'Reportes' : tab === 'menu' ? 'Menú' : tab === 'combos' ? 'Combos' : tab === 'users' ? 'Equipo' : 'Ajustes'}
                </button>
            ))}
        </div>

        <button onClick={onLogout} className="text-slate-400 hover:text-red-400 transition-colors flex gap-2 items-center text-sm font-bold px-4 py-2 rounded-lg hover:bg-white/5">
            <LogOut size={18} /> Salir
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'analytics' && <AnalyticsPanel enablePrint={true} />}
        
        {/* Renderizado Condicional: Pestaña de Combos */}
        {activeTab === 'combos' && <AdminCombos />}

        {activeTab === 'menu' && (
            // ... (Código original de la pestaña Menú)
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Catálogo de Productos</h2>
                    <button onClick={() => handleOpenForm()} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex gap-2 items-center transition-all hover:scale-105 active:scale-95"><Plus size={18}/> Crear Producto</button>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-black text-slate-500 tracking-wider">
                            <tr><th className="p-4">Producto</th><th className="p-4">Categoría</th><th className="p-4">Estación</th><th className="p-4">Precio</th><th className="p-4 text-right">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {products.map(p => (
                                <tr key={p.id} className="hover:bg-orange-50/50 transition-colors group">
                                    <td className="p-4 font-bold text-slate-700">{p.name}</td>
                                    <td className="p-4 text-slate-500">{p.mainCategory}</td>
                                    <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">{p.station}</span></td>
                                    <td className="p-4 font-mono font-bold">${p.price}</td>
                                    <td className="p-4 flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenForm(p)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit size={18}/></button>
                                        <button onClick={() => { if(window.confirm("¿Borrar?")) { deleteDoc(doc(db, "menuItems", p.id)).then(fetchProducts) }}} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {isEditing && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-6 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-black text-slate-800">Administrar Producto</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
                                    <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium" placeholder="Ej: Pizza Pepperoni" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Precio ($)</label>
                                        <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium" type="number" placeholder="0.00" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Estación</label>
                                        <select className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium" value={formData.station} onChange={e=>setFormData({...formData, station:e.target.value})}>
                                            <option value="cocina">Cocina</option>
                                            <option value="barra">Barra/Bebidas</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={()=>setIsEditing(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
                                <button onClick={handleSaveProduct} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all hover:scale-105">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'users' && (
            // ... (Código original de la pestaña Usuarios)
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Equipo de Trabajo</h2>
                    <button onClick={() => setIsCreatingUser(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex gap-2 items-center transition-all"><Plus size={18}/> Nuevo Usuario</button>
                </div>
                <div className="grid gap-4">
                    {users.map(u => (
                        <div key={u.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all flex justify-between items-center group ${u.active ? 'border-slate-200 hover:border-orange-200' : 'border-red-100 bg-red-50/30 opacity-80'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {u.active ? <UserCheck size={20}/> : <UserX size={20}/>}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-lg">{u.name}</p>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        {u.email} • <span className="uppercase font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">{u.role}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {u.role !== ROLES.ADMIN && (
                                    <>
                                        <button 
                                            onClick={() => toggleUserStatus(u)}
                                            className={`p-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${
                                                u.active 
                                                ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                                                : 'text-green-600 bg-green-50 hover:bg-green-100'
                                            }`}
                                        >
                                            {u.active ? 'Bloquear' : 'Activar'}
                                        </button>
                                        <button onClick={()=>handleDeleteUser(u)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all"><Trash2 size={20}/></button>
                                    </>
                                )}
                                {u.role === ROLES.ADMIN && <span className="text-xs text-slate-300 font-bold italic self-center px-4">Protegido</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {isCreatingUser && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <form onSubmit={handleCreateUser} className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-5 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-black text-slate-800">Nuevo Miembro</h3>
                            <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500" placeholder="Nombre Completo" onChange={e=>setNewUser({...newUser, name:e.target.value})} required/>
                            <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500" type="email" placeholder="Correo Electrónico" onChange={e=>setNewUser({...newUser, email:e.target.value})} required/>
                            <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500" type="password" placeholder="Contraseña" onChange={e=>setNewUser({...newUser, password:e.target.value})} required/>
                            <select className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500" value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})}>
                                <option value={ROLES.RECEPTION}>Recepción</option>
                                <option value={ROLES.KITCHEN}>Cocina</option>
                                <option value={ROLES.ADMIN}>Administrador</option>
                            </select>
                             <div className="flex justify-end gap-3 pt-2">
                                 <button type="button" onClick={()=>setIsCreatingUser(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
                                 <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-800">Crear</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'config' && (
            // ... (Código original de la pestaña Config)
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <h3 className="font-black text-slate-800 mb-4 text-lg">Reglas de Precio</h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Costo Ingrediente Extra</label>
                            <div className="relative"><span className="absolute left-3 top-3 text-slate-400">$</span>
                            <input className="bg-slate-50 border border-slate-200 p-3 pl-8 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold" type="number" value={prices.extraIngredient} onChange={e=>setPrices({...prices, extraIngredient: e.target.value})} /></div>
                        </div>
                        <button onClick={handleSaveGlobalConfig} className="bg-slate-900 text-white w-full py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-transform active:scale-95 mt-2">Guardar Cambios</button>
                    </div>
                </div>
                <div className="lg:col-span-2 grid gap-6">
                    <ListEditor title="Ingredientes Disponibles" items={ingredients} setItems={setIngredients} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ListEditor title="Bebidas" items={drinks} setItems={setDrinks} />
                        <ListEditor title="Complementos" items={sides} setItems={setSides} />
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}