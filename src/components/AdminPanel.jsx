// src/components/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import {
  LogOut,
  Plus,
  Trash2,
  Settings,
  Edit,
  X as XIcon,
  UserCheck,
  UserX
} from "lucide-react";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  setDoc,
  query,
  where,
  getCountFromServer
} from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { db, firebaseConfig } from "../services/firebase";
import { useConfig } from "../hooks/useConfig";
import { useOrders } from "../hooks/useOrders";
import AnalyticsPanel from "./AnalyticsPanel";
import AdminCombos from "./admin/AdminCombos";
import { toast } from "react-hot-toast";
import { ROLES } from "../constants/types";

const ListEditor = ({ title, items, setItems }) => {
  const [val, setVal] = useState("");

  const handleAdd = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      toast.error("Ese valor ya existe.");
      return;
    }
    setItems([...items, trimmed]);
    setVal("");
  };

  const handleRemove = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h4 className="font-black text-xs uppercase text-slate-400 mb-4 flex justify-between tracking-widest">
        {title}
        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
          {items.length}
        </span>
      </h4>

      <div className="flex-1 content-start flex flex-wrap gap-2 mb-4 overflow-y-auto max-h-48">
        {items.map((item, i) => (
          <span
            key={i}
            className="bg-slate-50 border border-slate-200 pl-3 pr-1 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 text-slate-700 group hover:border-orange-200 hover:bg-orange-50 transition-colors"
          >
            {item}
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="text-slate-300 hover:text-red-500 p-1 rounded-md hover:bg-white transition-all"
            >
              <XIcon size={14} />
            </button>
          </span>
        ))}
        {!items.length && (
          <p className="text-xs text-slate-400">Sin elementos configurados.</p>
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-100 pt-4">
        <input
          className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm flex-1 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Nuevo ítem..."
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-lg transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState("analytics");
  const { config, loadingConfig } = useConfig();
  const { archiveOldOrders } = useOrders();

  // Mantenimiento automático de órdenes viejas
  useEffect(() => {
    const checkOldData = async () => {
      try {
        if (sessionStorage.getItem("checked_archive")) return;

        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 90);

        const qRef = query(
          collection(db, "orders"),
          where("createdAt", "<", limitDate)
        );
        const snapshot = await getCountFromServer(qRef);

        const count = snapshot.data().count || 0;
        if (count > 0) {
          const ok = window.confirm(
            `MANTENIMIENTO:\nHay ${count} órdenes con más de 90 días.\n¿Moverlas al archivo?`
          );
          if (ok) {
            const moved = await archiveOldOrders();
            toast.success(`${moved} órdenes archivadas.`);
          }
        }

        sessionStorage.setItem("checked_archive", "true");
      } catch (err) {
        console.error("Error en mantenimiento:", err);
      }
    };

    checkOldData();
  }, [archiveOldOrders]);

  // ---- Estado de productos (menú) ----
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const emptyProduct = {
    id: null,
    name: "",
    price: "",
    stock: "",
    mainCategory: "Pizzas",
    station: ROLES.KITCHEN,
    isActive: true
  };

  const [formData, setFormData] = useState(emptyProduct);

  // ---- Estado de usuarios ----
  const [users, setUsers] = useState([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: ROLES.RECEPTION
  });

  // ---- Estado de configuración (ingredientes / bebidas / sides) ----
  const [ingredients, setIngredients] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [sides, setSides] = useState([]);
  const [prices, setPrices] = useState({
    extraIngredient: 0,
    sizeDifference: 0
  });

  // Cargar config inicial en los estados locales
  useEffect(() => {
    if (!config) return;
    setIngredients(config.ingredients || []);
    setDrinks(config.drinks || []);
    setSides(config.sides || []);

    const ingredientPrice = config.rules?.ingredientPrice ?? 0;
    const sizeDiff = config.rules?.sizes?.Grande?.priceModifier ?? 0;

    setPrices({
      extraIngredient: ingredientPrice,
      sizeDifference: sizeDiff
    });
  }, [config]);

  // Cargar datos cuando se cambia de pestaña
  useEffect(() => {
    if (activeTab === "menu") {
      fetchProducts();
    }
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  // ---- Firestore helpers ----

  const fetchProducts = async () => {
  setLoadingProducts(true);

  const snap = await getDocs(collection(db, "menuItems"));

  const items = snap.docs
    .map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id, // SIEMPRE usamos el ID REAL DE FIRESTORE
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  setProducts(items);
  setLoadingProducts(false);
};


  const handleOpenForm = (product) => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name || "",
        price: product.price ?? "",
        stock:
          typeof product.stock === "number" && !Number.isNaN(product.stock)
            ? String(product.stock)
            : "",
        mainCategory: product.mainCategory || "Pizzas",
        station: product.station || ROLES.KITCHEN,
        isActive:
          typeof product.isActive === "boolean" ? product.isActive : true
      });
    } else {
      setFormData(emptyProduct);
    }
    setIsEditing(true);
  };

  const handleSaveProduct = async () => {
  if (!formData.name?.trim()) {
    return toast.error("Nombre obligatorio");
  }

  // Nunca subimos el id a Firestore
  const { id, ...rest } = formData;

  const pData = {
    ...rest,
    price: parseFloat(rest.price || 0),
    stock:
      rest.stock !== "" && rest.stock != null
        ? parseInt(rest.stock, 10)
        : null,
  };

  try {
    if (id) {
      // EDITAR
      await updateDoc(doc(db, "menuItems", id), pData);
    } else {
      // CREAR
      await addDoc(collection(db, "menuItems"), pData);
    }

    toast.success("Producto guardado");
    setIsEditing(false);
    fetchProducts();
  } catch (e) {
    console.error(e);
    toast.error(e.message || "Error al guardar el producto");
  }
};

  const handleDeleteProduct = async (product) => {
    const ok = window.confirm(`¿Eliminar "${product.name}" del menú?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "menuItems", product.id));
      toast.success("Producto eliminado");
      fetchProducts();
    } catch (err) {
      console.error("Error eliminando producto:", err);
      toast.error("No se pudo eliminar");
    }
  };

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setUsers(list);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      toast.error("No se pudieron cargar los usuarios");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error("Completa todos los campos");
      return;
    }

    const secondaryApp = initializeApp(firebaseConfig, "secondary-admin");
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUser.email,
        newUser.password
      );

      await setDoc(doc(db, "users", cred.user.uid), {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        active: true
      });

      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      toast.success("Usuario creado");
      setIsCreatingUser(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: ROLES.RECEPTION
      });
      fetchUsers();
    } catch (err) {
      console.error("Error creando usuario:", err);
      toast.error("No se pudo crear el usuario");
    }
  };

  const toggleUserStatus = async (user) => {
    if (user.role === ROLES.ADMIN) {
      toast.error("No se puede bloquear a un administrador");
      return;
    }

    const newStatus = !user.active;

    try {
      await updateDoc(doc(db, "users", user.id), { active: newStatus });
      toast.success(newStatus ? "Usuario activado" : "Usuario bloqueado");
      fetchUsers();
    } catch (err) {
      console.error("Error cambiando estado:", err);
      toast.error("No se pudo actualizar el usuario");
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === ROLES.ADMIN) {
      toast.error("No se pueden eliminar administradores");
      return;
    }
    const ok = window.confirm(`¿Eliminar al usuario "${user.name}"?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "users", user.id));
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      toast.error("No se pudo eliminar");
    }
  };

  const handleSaveGlobalConfig = async () => {
    try {
      const ref = doc(db, "configuration", "global_options");

      const ingredientPrice = Number(prices.extraIngredient) || 0;
      const sizeDiff = Number(prices.sizeDifference) || 0;

      await updateDoc(ref, {
        ingredients,
        drinks,
        sides,
        rules: {
          ingredientPrice,
          sizes: {
            Personal: { label: "Personal", priceModifier: 0 },
            Grande: { label: "Gigante", priceModifier: sizeDiff }
          }
        }
      });

      toast.success("Configuración guardada");
    } catch (err) {
      console.error("Error guardando configuración:", err);
      toast.error("No se pudo guardar la configuración");
    }
  };

  if (loadingConfig) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">
        Cargando Panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navbar */}
      <header className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-lg z-20">
        <h1 className="text-xl font-black flex gap-3 items-center tracking-tight">
          <span className="bg-orange-600 p-1.5 rounded-lg">
            <Settings size={20} className="text-white" />
          </span>
          PANEL ADMIN
        </h1>

        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          {["analytics", "menu", "combos", "users", "config"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab === "analytics"
                ? "Reportes"
                : tab === "menu"
                ? "Menú"
                : tab === "combos"
                ? "Combos"
                : tab === "users"
                ? "Equipo"
                : "Ajustes"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="text-slate-400 hover:text-red-400 transition-colors flex gap-2 items-center text-sm font-bold px-4 py-2 rounded-lg hover:bg-white/5"
        >
          <LogOut size={18} /> Salir
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === "analytics" && <AnalyticsPanel enablePrint />}

        {activeTab === "combos" && <AdminCombos />}

        {activeTab === "menu" && (
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">
                Catálogo de productos
              </h2>
              <button
                type="button"
                onClick={() => handleOpenForm(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex gap-2 items-center transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={18} />
                Crear producto
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-black text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Estación</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingProducts && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-400"
                      >
                        Cargando productos...
                      </td>
                    </tr>
                  )}
                  {!loadingProducts && !products.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-400"
                      >
                        No hay productos registrados.
                      </td>
                    </tr>
                  )}
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-orange-50/50 transition-colors group"
                    >
                      <td className="p-4 font-bold text-slate-700">
                        {p.name}
                        {!p.isActive && (
                          <span className="ml-2 text-[10px] uppercase font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500">
                        {p.mainCategory || "-"}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">
                          {p.station || "-"}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold">
                        {typeof p.price === "number" ? `$${p.price}` : "-"}
                      </td>
                      <td className="p-4 flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenForm(p)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isEditing && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-6 animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-black text-slate-800">
                    {formData.id ? "Editar producto" : "Nuevo producto"}
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        Nombre
                      </label>
                      <input
                        className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                        placeholder="Ej: Pizza Pepperoni"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">
                          Precio ($)
                        </label>
                        <input
                          type="number"
                          className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              price: e.target.value
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">
                          Estación
                        </label>
                        <select
                          className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                          value={formData.station}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              station: e.target.value
                            }))
                          }
                        >
                          <option value={ROLES.KITCHEN}>Cocina</option>
                          <option value="barra">Barra / Bebidas</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        Categoría
                      </label>
                      <input
                        className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                        placeholder="Ej: Pizzas, Bebidas, Combos..."
                        value={formData.mainCategory}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            mainCategory: e.target.value
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        id="isActive"
                        type="checkbox"
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isActive: e.target.checked
                          }))
                        }
                      />
                      <label
                        htmlFor="isActive"
                        className="text-sm text-slate-600"
                      >
                        Producto activo en el POS
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProduct}
                      className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all hover:scale-105"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "users" && (
          <section className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">
                Equipo de trabajo
              </h2>
              <button
                type="button"
                onClick={() => setIsCreatingUser(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex gap-2 items-center transition-all"
              >
                <Plus size={18} />
                Nuevo usuario
              </button>
            </div>

            <div className="grid gap-4">
              {!users.length && (
                <p className="text-sm text-slate-400">
                  Aún no hay usuarios registrados en la base de datos.
                </p>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`bg-white p-5 rounded-2xl shadow-sm border transition-all flex justify-between items-center group ${
                    u.active
                      ? "border-slate-200 hover:border-orange-200"
                      : "border-red-100 bg-red-50/30 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        u.active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {u.active ? (
                        <UserCheck size={20} />
                      ) : (
                        <UserX size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">
                        {u.name || "(Sin nombre)"}
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        {u.email}
                        <span className="uppercase font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {u.role}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {u.role !== ROLES.ADMIN ? (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u)}
                          className={`p-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${
                            u.active
                              ? "text-orange-600 bg-orange-50 hover:bg-orange-100"
                              : "text-green-600 bg-green-50 hover:bg-green-100"
                          }`}
                        >
                          {u.active ? "Bloquear" : "Activar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-300 font-bold italic self-center px-4">
                        Admin protegido
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {isCreatingUser && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <form
                  onSubmit={handleCreateUser}
                  className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-5 animate-in zoom-in-95 duration-200"
                >
                  <h3 className="text-xl font-black text-slate-800">
                    Nuevo miembro
                  </h3>
                  <input
                    className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Nombre completo"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                  <input
                    className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500"
                    type="email"
                    placeholder="Correo electrónico"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                  <input
                    className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500"
                    type="password"
                    placeholder="Contraseña temporal"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        password: e.target.value
                      }))
                    }
                    required
                  />
                  <select
                    className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, role: e.target.value }))
                    }
                  >
                    <option value={ROLES.RECEPTION}>Recepción</option>
                    <option value={ROLES.KITCHEN}>Cocina</option>
                    <option value={ROLES.ADMIN}>Administrador</option>
                  </select>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingUser(false)}
                      className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-800"
                    >
                      Crear
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        )}

        {activeTab === "config" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
              <h3 className="font-black text-slate-800 mb-4 text-lg">
                Reglas de precio
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Costo ingrediente extra
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      className="bg-slate-50 border border-slate-200 p-3 pl-8 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                      value={prices.extraIngredient}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          extraIngredient: e.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Diferencia de precio tamaño grande
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      className="bg-slate-50 border border-slate-200 p-3 pl-8 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                      value={prices.sizeDifference}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          sizeDifference: e.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveGlobalConfig}
                  className="bg-slate-900 text-white w-full py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-transform active:scale-95 mt-2"
                >
                  Guardar cambios
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 grid gap-6">
              <ListEditor
                title="Ingredientes disponibles"
                items={ingredients}
                setItems={setIngredients}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ListEditor
                  title="Bebidas"
                  items={drinks}
                  setItems={setDrinks}
                />
                <ListEditor
                  title="Complementos"
                  items={sides}
                  setItems={setSides}
                />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
