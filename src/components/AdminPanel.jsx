import React, { useState, useEffect } from "react";
import {
  LogOut,
  Plus,
  Trash2,
  Settings,
  Edit,
  X as XIcon,
  UserCheck,
  UserX,
  Pizza,
  Sandwich,
  CupSoda,
  Layers,
  UtensilsCrossed,
  IceCream,
  Soup,
  Croissant,
  AlertTriangle
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

// --- COMPONENTE MODAL DE CONFIRMACIÓN (Dark Mode) ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400 mb-6">{message}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="py-2.5 px-4 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="py-2.5 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper para iconos de categoría
const getCategoryIcon = (catName) => {
  const lower = (catName || "").toLowerCase();
  if (lower.includes("pizza")) return <Pizza size={16} className="text-orange-400" />;
  if (lower.includes("hamburguesa") || lower.includes("burger")) return <Sandwich size={16} className="text-orange-400" />;
  if (lower.includes("bebida") || lower.includes("drink")) return <CupSoda size={16} className="text-blue-400" />;
  if (lower.includes("combo")) return <Layers size={16} className="text-purple-400" />;
  if (lower.includes("postre") || lower.includes("helado")) return <IceCream size={16} className="text-pink-400" />;
  if (lower.includes("birria") || lower.includes("sopa")) return <Soup size={16} className="text-red-400" />;
  if (lower.includes("complemento") || lower.includes("side")) return <Croissant size={16} className="text-yellow-400" />;
  return <UtensilsCrossed size={16} className="text-slate-500" />;
};

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
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm h-full flex flex-col">
      <h4 className="font-black text-xs uppercase text-slate-400 mb-4 flex justify-between tracking-widest">
        {title}
        <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
          {items.length}
        </span>
      </h4>

      <div className="flex-1 content-start flex flex-wrap gap-2 mb-4 overflow-y-auto max-h-48 custom-scrollbar">
        {items.map((item, i) => (
          <span
            key={i}
            className="bg-slate-950 border border-slate-800 pl-3 pr-1 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 text-slate-300 group hover:border-orange-500/50 hover:bg-slate-900 transition-colors"
          >
            {item}
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-slate-800 transition-all"
            >
              <XIcon size={14} />
            </button>
          </span>
        ))}
        {!items.length && (
          <p className="text-xs text-slate-600">Sin elementos configurados.</p>
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-800 pt-4">
        <input
          className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm flex-1 outline-none text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-orange-500 transition-all"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Nuevo ítem..."
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-orange-600 hover:bg-orange-500 text-white p-2.5 rounded-lg transition-colors shadow-lg shadow-orange-900/20"
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

  // Estado para el modal de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  });

  // Helper para abrir confirmación
  const requestConfirm = (title, message, action) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await action();
      }
    });
  };

  // Mantenimiento automático de órdenes viejas
  useEffect(() => {
    const checkOldData = async () => {
      try {
        if (typeof window !== "undefined" && window.sessionStorage.getItem("checked_archive")) return;

        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 90);

        const qRef = query(
          collection(db, "orders"),
          where("createdAt", "<", limitDate)
        );
        const snapshot = await getCountFromServer(qRef);

        const count = snapshot.data().count || 0;
        if (count > 0) {
          requestConfirm(
            "Mantenimiento",
            `Hay ${count} órdenes con más de 90 días. ¿Moverlas al archivo?`,
            async () => {
              const moved = await archiveOldOrders();
              toast.success(`${moved} órdenes archivadas.`);
            }
          );
        }

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("checked_archive", "true");
        }
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

  useEffect(() => {
    if (activeTab === "menu") {
      fetchProducts();
    }
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const snap = await getDocs(collection(db, "menuItems"));
      
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      setProducts(items);
    } catch (error) {
      console.error("Error cargando productos:", error);
      toast.error("Error cargando el menú");
    } finally {
      setLoadingProducts(false);
    }
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
    // --- VALIDACIÓN ---
    if (!formData.name?.trim()) {
      return toast.error("Nombre obligatorio");
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return toast.error("El precio debe ser un número mayor a 0");
    }

    let stockNum = null;
    if (formData.stock !== "" && formData.stock != null) {
      stockNum = parseInt(formData.stock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        return toast.error("El stock no puede ser negativo");
      }
    }

    const { id, ...rest } = formData;

    const pData = {
      ...rest,
      price: priceNum,
      stock: stockNum,
    };

    try {
      if (id) {
        await updateDoc(doc(db, "menuItems", id), pData);
      } else {
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

  const handleDeleteProduct = (product) => {
    requestConfirm(
      "Eliminar producto",
      `¿Estás seguro de eliminar "${product.name}" del menú? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await deleteDoc(doc(db, "menuItems", product.id));
          toast.success("Producto eliminado");
          fetchProducts();
        } catch (err) {
          console.error("Error eliminando producto:", err);
          toast.error("No se pudo eliminar");
        }
      }
    );
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

  const handleDeleteUser = (user) => {
    if (user.role === ROLES.ADMIN) {
      toast.error("No se pueden eliminar administradores");
      return;
    }
    requestConfirm(
      "Eliminar usuario",
      `¿Eliminar permanentemente al usuario "${user.name}"?`,
      async () => {
        try {
          await deleteDoc(doc(db, "users", user.id));
          toast.success("Usuario eliminado");
          fetchUsers();
        } catch (err) {
          console.error("Error eliminando usuario:", err);
          toast.error("No se pudo eliminar");
        }
      }
    );
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
          ingredient_extra_price: ingredientPrice,
          sizes: {
            Personal: { label: "Personal", priceModifier: 0 },
            Grande: { label: "Gigante", priceModifier: sizeDiff }
          }
        },
        prices: {
          extraIngredient: ingredientPrice,
          sizeDifference: sizeDiff
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
      <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-500 font-bold animate-pulse">
        Cargando Panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200">
      
      {/* Modal de confirmación global */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex justify-between items-center shadow-lg z-20 sticky top-0">
        <h1 className="text-xl font-black flex gap-3 items-center tracking-tight text-white">
          <span className="bg-gradient-to-br from-orange-600 to-red-600 p-1.5 rounded-lg shadow-lg shadow-orange-900/40">
            <Settings size={20} className="text-white" />
          </span>
          PANEL ADMIN
        </h1>

        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {["analytics", "menu", "combos", "users", "config"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-slate-800 text-white border border-slate-700 shadow-md"
                  : "text-slate-500 hover:text-slate-200 hover:bg-slate-900"
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
          className="text-slate-400 hover:text-red-400 transition-colors flex gap-2 items-center text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-900/10 border border-transparent hover:border-red-900/30"
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
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Catálogo de productos
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gestiona los items disponibles para la venta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenForm(null)}
                className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-900/30 flex gap-2 items-center transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={18} />
                Crear producto
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 border-b border-slate-800 text-xs uppercase font-black text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Estación</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {loadingProducts && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-500 animate-pulse"
                      >
                        Cargando productos...
                      </td>
                    </tr>
                  )}
                  {!loadingProducts && !products.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-500"
                      >
                        No hay productos registrados.
                      </td>
                    </tr>
                  )}
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="p-4 font-bold text-slate-200">
                        {p.name}
                        {!p.isActive && (
                          <span className="ml-2 text-[10px] uppercase font-bold text-red-400 bg-red-900/20 border border-red-900/30 px-2 py-0.5 rounded">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          {getCategoryIcon(p.mainCategory)}
                          <span>{p.mainCategory || "-"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded text-xs font-bold uppercase">
                          {p.station || "-"}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-orange-400">
                        {typeof p.price === "number" ? `$${p.price.toFixed(2)}` : "-"}
                      </td>
                      <td className="p-4 flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenForm(p)}
                          className="text-blue-400 hover:bg-blue-900/20 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-900/30"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="text-red-400 hover:bg-red-900/20 p-2 rounded-lg transition-colors border border-transparent hover:border-red-900/30"
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
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-6 animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-black text-white">
                    {formData.id ? "Editar producto" : "Nuevo producto"}
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Nombre
                      </label>
                      <input
                        className="bg-slate-950 border border-slate-800 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium text-white placeholder:text-slate-600"
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
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Precio ($)
                        </label>
                        <input
                          type="number"
                          className="bg-slate-950 border border-slate-800 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium text-white placeholder:text-slate-600"
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
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Estación
                        </label>
                        <select
                          className="bg-slate-950 border border-slate-800 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium text-white"
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
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Stock
                      </label>
                      <input
                        type="number"
                        className="bg-slate-950 border border-slate-800 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium text-white placeholder:text-slate-600"
                        placeholder="Opcional (vacío = infinito)"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            stock: e.target.value
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Categoría
                      </label>
                      <input
                        className="bg-slate-950 border border-slate-800 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-medium text-white placeholder:text-slate-600"
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
                        className="rounded border-slate-700 bg-slate-800 text-orange-600 focus:ring-orange-500 focus:ring-offset-slate-900"
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
                        className="text-sm text-slate-400 select-none"
                      >
                        Producto activo en el POS
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProduct}
                      className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-900/40 transition-all hover:scale-105"
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
            {/* (Se mantiene el código de usuarios igual, solo resumido aquí para brevedad) */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                Equipo de trabajo
              </h2>
              <button
                type="button"
                onClick={() => setIsCreatingUser(true)}
                className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-900/30 flex gap-2 items-center transition-all hover:scale-105"
              >
                <Plus size={18} />
                Nuevo usuario
              </button>
            </div>
            <div className="grid gap-4">
                {/* ... Lista de usuarios ... */}
                {users.map((u) => (
                  <div key={u.id} className="bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {u.active ? <UserCheck size={20} /> : <UserX size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-100 text-lg">{u.name}</p>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                        {u.role !== ROLES.ADMIN && (
                            <>
                            <button onClick={() => toggleUserStatus(u)} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">
                                {u.active ? "Bloquear" : "Activar"}
                            </button>
                            <button onClick={() => handleDeleteUser(u)} className="p-2 bg-slate-800 rounded hover:bg-red-900/20 text-red-400">
                                <Trash2 size={18} />
                            </button>
                            </>
                        )}
                    </div>
                  </div>
                ))}
            </div>
             {/* ... Modal Crear Usuario ... */}
             {isCreatingUser && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleCreateUser} className="bg-slate-900 p-6 rounded-xl border border-slate-800 w-full max-w-sm space-y-4">
                         <h3 className="text-white font-bold">Nuevo Usuario</h3>
                         <input className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-white" placeholder="Nombre" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                         <input className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-white" type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                         <input className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-white" type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                         <select className="w-full bg-slate-950 p-2 rounded border border-slate-700 text-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                             <option value={ROLES.RECEPTION}>Recepción</option>
                             <option value={ROLES.KITCHEN}>Cocina</option>
                         </select>
                         <div className="flex justify-end gap-2">
                             <button type="button" onClick={() => setIsCreatingUser(false)} className="text-slate-400">Cancelar</button>
                             <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded">Crear</button>
                         </div>
                    </form>
                </div>
             )}
          </section>
        )}

        {activeTab === "config" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ... Configuración (sin cambios) ... */}
             <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 h-fit">
              <h3 className="font-black text-slate-200 mb-4 text-lg">
                Reglas de precio
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Costo ingrediente extra
                  </label>
                  <input
                      type="number"
                      className="bg-slate-950 border border-slate-800 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold text-white"
                      value={prices.extraIngredient}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          extraIngredient: e.target.value
                        }))
                      }
                    />
                </div>
                 <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Dif. precio Grande
                  </label>
                  <input
                      type="number"
                      className="bg-slate-950 border border-slate-800 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold text-white"
                      value={prices.sizeDifference}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          sizeDifference: e.target.value
                        }))
                      }
                    />
                </div>
                <button
                  type="button"
                  onClick={handleSaveGlobalConfig}
                  className="bg-slate-800 text-white w-full py-3 rounded-xl font-bold shadow-lg hover:bg-slate-700 border border-slate-700 transition-transform active:scale-95 mt-2"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
            <div className="lg:col-span-2 grid gap-6">
              <ListEditor title="Ingredientes" items={ingredients} setItems={setIngredients} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ListEditor title="Bebidas" items={drinks} setItems={setDrinks} />
                 <ListEditor title="Complementos" items={sides} setItems={setSides} />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}