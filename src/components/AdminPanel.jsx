import React, { useState, useEffect } from "react";
import { LogOut, Save, Plus, Trash2, Settings, Pizza, Users, BarChart2, Edit, X as XIcon, ToggleLeft, ToggleRight } from "lucide-react";
import { doc, updateDoc, collection, addDoc, deleteDoc, getDocs, setDoc, query, where, getCountFromServer } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, firebaseConfig } from "../services/firebase";
import { useConfig } from "../hooks/useConfig";
import { useOrders } from "../hooks/useOrders";
import AnalyticsPanel from "./AnalyticsPanel";
import { toast } from "react-hot-toast";

const ListEditor = ({ title, items, setItems }) => {
  const [val, setVal] = useState("");
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <h4 className="font-bold text-xs uppercase text-slate-500 mb-3 flex justify-between">{title} <span className="bg-slate-100 px-2 rounded text-slate-600">{items.length}</span></h4>
      <div className="flex flex-wrap gap-2 mb-3">
        {items.map((item, i) => <span key={i} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-xs flex items-center gap-1 text-slate-700">{item} <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400 ml-1"><XIcon size={12}/></button></span>)}
      </div>
      <div className="flex gap-2"><input className="border p-2 rounded text-sm flex-1 outline-none" value={val} onChange={e => setVal(e.target.value)} placeholder="Agregar..." /><button onClick={() => { if(val.trim()) { setItems([...items, val.trim()]); setVal(""); } }} className="bg-amber-600 text-white p-2 rounded"><Plus size={16}/></button></div>
    </div>
  );
};

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState("analytics"); 
  const { config, loadingConfig } = useConfig();
  const { archiveOldOrders } = useOrders();
  
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
  }, []);

  // ... (Estados de productos/usuarios idénticos a antes)
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const initialFormState = { id: null, name: "", price: "", stock: "", mainCategory: "Pizzas", station: "cocina", isActive: true, isClassic: false, isCombo: false, comboHasDrink: true, comboHasSide: true };
  const [formData, setFormData] = useState(initialFormState);
  const [users, setUsers] = useState([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "recepcion" });
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
    setProducts(q.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.name.localeCompare(b.name)));
    setLoadingProducts(false);
  };
  
  const handleOpenForm = (p) => { setFormData(p ? {...p, stock: p.stock ?? ""} : initialFormState); setIsEditing(true); };

  const handleSaveProduct = async () => {
      if (!formData.name?.trim()) return toast.error("Nombre obligatorio");
      const pData = { ...formData, price: parseFloat(formData.price), stock: formData.stock !== "" ? parseInt(formData.stock) : null };
      try {
        formData.id ? await updateDoc(doc(db, "menuItems", formData.id), pData) : await addDoc(collection(db, "menuItems"), pData);
        toast.success("Guardado"); setIsEditing(false); fetchProducts();
      } catch (e) { toast.error(e.message); }
  };

  const fetchUsers = async () => {
      const q = await getDocs(collection(db, "users"));
      setUsers(q.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  const handleDeleteUser = async (user) => {
      if (user.role === 'admin') return toast.error("No puedes borrar admins");
      if(window.confirm("¿Borrar?")) { try { await deleteDoc(doc(db, "users", user.id)); fetchUsers(); } catch(e){} }
  };

  const handleSaveGlobalConfig = async () => {
      try {
        await updateDoc(doc(db, "configuration", "global_options"), { ingredients, drinks, sides, prices: { extraIngredient: parseFloat(prices.extraIngredient), sizeDifference: parseFloat(prices.sizeDifference) } });
        toast.success("Configuración guardada");
      } catch (e) { toast.error("Error"); }
  };

  if (loadingConfig) return <div>Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold flex gap-2"><Settings className="text-amber-400" /> Admin Panel</h1>
        <div className="flex gap-2">
            <button onClick={() => setActiveTab('analytics')} className="px-3 py-1 bg-slate-700 rounded text-sm">Reportes</button>
            <button onClick={() => setActiveTab('menu')} className="px-3 py-1 bg-slate-700 rounded text-sm">Menú</button>
            <button onClick={() => setActiveTab('users')} className="px-3 py-1 bg-slate-700 rounded text-sm">Usuarios</button>
            <button onClick={() => setActiveTab('config')} className="px-3 py-1 bg-slate-700 rounded text-sm">Config</button>
            <button onClick={onLogout} className="text-red-400 ml-4"><LogOut size={20} /></button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'analytics' && <AnalyticsPanel enablePrint={true} />}
        
        {activeTab === 'menu' && (
            <div className="space-y-4">
                <button onClick={() => handleOpenForm()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex gap-2"><Plus/> Nuevo</button>
                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 uppercase font-bold"><tr><th className="p-3">Nombre</th><th className="p-3">Precio</th><th className="p-3">Acciones</th></tr></thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3">{p.name}</td><td className="p-3">${p.price}</td>
                                    <td className="p-3 flex gap-2">
                                        <button onClick={() => handleOpenForm(p)} className="text-blue-600"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {isEditing && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded w-96 space-y-4">
                            <h3 className="font-bold">Editar Producto</h3>
                            <input className="border p-2 w-full" placeholder="Nombre" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                            <input className="border p-2 w-full" type="number" placeholder="Precio" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                            <div className="flex justify-end gap-2"><button onClick={()=>setIsEditing(false)} className="bg-gray-200 px-3 py-1 rounded">Cancelar</button><button onClick={handleSaveProduct} className="bg-blue-600 text-white px-3 py-1 rounded">Guardar</button></div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'users' && (
            <div className="space-y-4">
                <button onClick={() => setIsCreatingUser(true)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex gap-2"><Plus/> Usuario</button>
                {users.map(u => <div key={u.id} className="bg-white p-3 rounded shadow flex justify-between"><span>{u.name} ({u.role})</span><button onClick={()=>handleDeleteUser(u)} className="text-red-600"><Trash2 size={16}/></button></div>)}
                {isCreatingUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <form onSubmit={handleCreateUser} className="bg-white p-6 rounded w-80 space-y-3">
                            <input className="border p-2 w-full" placeholder="Nombre" onChange={e=>setNewUser({...newUser, name:e.target.value})}/>
                            <input className="border p-2 w-full" placeholder="Email" onChange={e=>setNewUser({...newUser, email:e.target.value})}/>
                            <input className="border p-2 w-full" type="password" placeholder="Pass" onChange={e=>setNewUser({...newUser, password:e.target.value})}/>
                             <div className="flex justify-end gap-2"><button type="button" onClick={()=>setIsCreatingUser(false)} className="bg-gray-200 px-3 py-1 rounded">Cancelar</button><button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Crear</button></div>
                        </form>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'config' && (
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow"><h3 className="font-bold mb-2">Precios</h3><input className="border p-2 w-full mb-2" type="number" value={prices.extraIngredient} onChange={e=>setPrices({...prices, extraIngredient: e.target.value})} /><button onClick={handleSaveGlobalConfig} className="bg-slate-800 text-white w-full py-2 rounded">Guardar</button></div>
                <div className="col-span-2 space-y-4">
                    <ListEditor title="Ingredientes" items={ingredients} setItems={setIngredients} />
                    <ListEditor title="Bebidas" items={drinks} setItems={setDrinks} />
                </div>
            </div>
        )}
      </div>
    </div>
  );
}