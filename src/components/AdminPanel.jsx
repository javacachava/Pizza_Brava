import React, { useState, useEffect } from "react";
import { 
  LogOut, Save, Plus, Trash2, Settings, Pizza, Users, 
  BarChart2, Edit, X as XIcon, ToggleLeft, ToggleRight, UserX, UserCheck, Shield
} from "lucide-react";
import { 
  doc, updateDoc, collection, addDoc, deleteDoc, getDocs, setDoc, query, where, getCountFromServer
} from "firebase/firestore";
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

const CATEGORY_OPTIONS = [
  "Pizzas", "Bebidas", "Hamburguesas", "Birrias", "Platos", "Entradas", "Complementos"
];

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState("analytics"); 
  const { config, loadingConfig } = useConfig();
  const { archiveOldOrders } = useOrders();
  
  // Limpieza automática al iniciar sesión
  useEffect(() => {
    const checkOldData = async () => {
        const hasChecked = sessionStorage.getItem("checked_archive");
        if(hasChecked) return;

        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 90);

        try {
            const coll = collection(db, "orders");
            const q = query(coll, where("createdAt", "<", limitDate));
            const snapshot = await getCountFromServer(q);
            const count = snapshot.data().count;

            if (count > 0) {
                if(window.confirm(`MANTENIMIENTO:\nHay ${count} órdenes antiguas (+90 días).\n¿Archivar para optimizar?`)) {
                    const archivedCount = await archiveOldOrders();
                    toast.success(`${archivedCount} órdenes archivadas.`);
                }
            }
            sessionStorage.setItem("checked_archive", "true");
        } catch (e) {
            console.error("Error mantenimiento", e);
        }
    };
    checkOldData();
  }, []);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const initialFormState = { id: null, name: "", price: "", stock: "", mainCategory: "Pizzas", station: "cocina", isActive: true, isClassic: false, isCombo: false, comboHasDrink: true, comboHasSide: true };
  const [formData, setFormData] = useState(initialFormState);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "recepcion" });
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

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const q = await getDocs(collection(db, "menuItems"));
      const items = q.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(items);
    } catch (e) { console.error(e); } finally { setLoadingProducts(false); }
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
          drinkChoices: [], sideChoices: []
        } : null
      };
  
      const toastId = toast.loading("Guardando...");
      try {
        if (formData.id) {
          await updateDoc(doc(db, "menuItems", formData.id), productData);
          toast.success("Actualizado", { id: toastId });
        } else {
          await addDoc(collection(db, "menuItems"), productData);
          toast.success("Creado", { id: toastId });
        }
        setIsEditing(false);
        fetchProducts();
      } catch (e) { toast.error("Error: " + e.message, { id: toastId }); }
  };

  const handleDeleteProduct = async (id) => {
      if(!window.confirm("¿Eliminar?")) return;
      try { await deleteDoc(doc(db, "menuItems", id)); fetchProducts(); } catch(e){}
  };
  
  const handleToggleActive = async (product) => {
      try {
        await updateDoc(doc(db, "menuItems", product.id), { isActive: !product.isActive });
        setProducts(products.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
      } catch (e) {}
  };

  const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const q = await getDocs(collection(db, "users"));
        setUsers(q.docs.map(doc => ({ id: doc.id, ...doc.data(), active: doc.data().active ?? true })));
      } catch (e) {} finally { setLoadingUsers(false); }
  };

  const handleCreateUser = async (e) => {
      e.preventDefault();
      if (newUser.password.length < 6) return toast.error("Password min 6 chars");
      const toastId = toast.loading("Creando...");
      const secondaryApp = initializeApp(firebaseConfig, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);
      try {
          const cred = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
          await setDoc(doc(db, "users", cred.user.uid), {
              email: newUser.email, name: newUser.name, role: newUser.role, active: true, createdAt: new Date()
          });
          await signOut(secondaryAuth);
          deleteApp(secondaryApp);
          toast.success("Usuario creado", { id: toastId });
          setIsCreatingUser(false); fetchUsers();
      } catch (error) { toast.error("Error creando usuario", { id: toastId }); }
  };
  
  const toggleUserStatus = async (user) => {
      if(user.role === 'admin') return;
      try { await updateDoc(doc(db, "users", user.id), { active: !user.active }); fetchUsers(); } catch(e){}
  };
  const handleDeleteUser = async (user) => {
      if(user.role === 'admin') return;
      if(window.confirm("¿Borrar permanentemente?")) {
          try { await deleteDoc(doc(db, "users", user.id)); fetchUsers(); } catch(e){}
      }
  };

  const handleSaveGlobalConfig = async () => {
      try {
        await updateDoc(doc(db, "configuration", "global_options"), {
          ingredients, drinks, sides,
          prices: { extraIngredient: parseFloat(prices.extraIngredient), sizeDifference: parseFloat(prices.sizeDifference) }
        });
        toast.success("Configuración guardada");
      } catch (e) { toast.error("Error guardando"); }
  };

  if (loadingConfig) return <div>Cargando...</div>;

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
        {activeTab === 'analytics' && <AnalyticsPanel enablePrint={true} />}

        {activeTab === 'menu' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Inventario</h2>
                    <button onClick={() => handleOpenForm()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow">
                        <Plus size={18}/> Nuevo Producto
                    </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-500 uppercase font-bold">
                            <tr><th>Nombre</th><th>Precio</th><th>Stock</th><th className="text-center">Estado</th><th className="text-right">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium">{p.name}</td>
                                    <td className="px-6 py-4 font-mono font-bold">${p.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-slate-500">{p.stock ?? '∞'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleToggleActive(p)} className={p.isActive!==false?'text-green-600':'text-slate-300'}>{p.isActive!==false?<ToggleRight size={28}/>:<ToggleLeft size={28}/>}</button>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleOpenForm(p)} className="p-2 bg-blue-50 text-blue-600 rounded"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {isEditing && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <div className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4">
                            <h3 className="font-bold text-lg">Producto</h3>
                            <input className="border p-2 w-full rounded" placeholder="Nombre" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                            <input className="border p-2 w-full rounded" type="number" placeholder="Precio" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                            <div className="flex justify-end gap-2">
                                <button onClick={()=>setIsEditing(false)} className="px-4 py-2 bg-slate-200 rounded">Cancelar</button>
                                <button onClick={handleSaveProduct} className="px-4 py-2 bg-green-600 text-white rounded">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'users' && (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Gestión de Personal</h2>
                    <button onClick={() => setIsCreatingUser(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow">
                        <Plus size={18}/> Registrar
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {users.map(user => (
                        <div key={user.id} className="bg-white p-4 rounded shadow border flex justify-between items-center">
                            <div><p className="font-bold">{user.name}</p><p className="text-xs text-slate-500">{user.email} ({user.role})</p></div>
                            {user.role !== 'admin' && <div className="flex gap-2">
                                <button onClick={()=>toggleUserStatus(user)} className="px-3 py-1 bg-slate-100 rounded text-xs">{user.active===false?'Activar':'Bloquear'}</button>
                                <button onClick={()=>handleDeleteUser(user)} className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs">Eliminar</button>
                            </div>}
                        </div>
                    ))}
                </div>
                {isCreatingUser && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
                            <h3 className="font-bold">Nuevo Usuario</h3>
                            <input required className="border p-2 w-full rounded" placeholder="Nombre" value={newUser.name} onChange={e=>setNewUser({...newUser, name:e.target.value})}/>
                            <input required type="email" className="border p-2 w-full rounded" placeholder="Email" value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})}/>
                            <input required type="password" className="border p-2 w-full rounded" placeholder="Password" value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})}/>
                            <select className="border p-2 w-full rounded" value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})}>
                                <option value="recepcion">Recepción</option>
                                <option value="cocina">Cocina</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div className="flex justify-end gap-2"><button type="button" onClick={()=>setIsCreatingUser(false)} className="px-4 py-2 bg-slate-200 rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Crear</button></div>
                        </form>
                    </div>
                )}
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