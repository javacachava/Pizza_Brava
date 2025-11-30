// src/components/admin/AdminCombos.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { Plus, Trash2, Save, Edit3, Layers, X as XIcon } from "lucide-react";
import { toast } from "react-hot-toast";

const createEmptyCombo = () => ({
  id: null,
  name: "",
  description: "",
  basePrice: 0,
  mainCategory: "Combos",
  station: "cocina",
  type: "combo",
  isActive: true,
  slots: [],
});

const createSlotId = () =>
  `slot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const SLOT_TYPES = [
  { value: "pizza_classic", label: "Pizza clásica" },
  { value: "side", label: "Complemento" },
  { value: "drink", label: "Bebida" },
];

export default function AdminCombos() {
  const [combos, setCombos] = useState([]);
  const [sides, setSides] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCombo, setEditingCombo] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const combosSnap = await getDocs(
          query(collection(db, "menuItems"), where("type", "==", "combo"))
        );
        const loadedCombos = combosSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setCombos(loadedCombos);

        const sidesSnap = await getDocs(collection(db, "sides"));
        setSides(
          sidesSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );

        const drinksSnap = await getDocs(collection(db, "drinks"));
        setDrinks(
          drinksSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );
      } catch (e) {
        console.error("Error cargando combos:", e);
        toast.error("Error al cargar combos");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const handleAddSlot = () => {
    if (!editingCombo) return;
    const newSlot = {
      id: createSlotId(),
      label: "Nuevo componente",
      type: "side",
      includedPrice: 0,
      allowedOptions: [],
    };
    setEditingCombo((prev) => ({
      ...prev,
      slots: [...(prev.slots || []), newSlot],
    }));
  };

  const handleUpdateSlot = (index, patch) => {
    if (!editingCombo) return;
    setEditingCombo((prev) => {
      const newSlots = [...(prev.slots || [])];
      newSlots[index] = { ...newSlots[index], ...patch };
      return { ...prev, slots: newSlots };
    });
  };

  const handleRemoveSlot = (index) => {
    if (!editingCombo) return;
    setEditingCombo((prev) => {
      const newSlots = [...(prev.slots || [])];
      newSlots.splice(index, 1);
      return { ...prev, slots: newSlots };
    });
  };

  const handleToggleAllowedOption = (slotIndex, optionId) => {
    if (!editingCombo) return;
    setEditingCombo((prev) => {
      const newSlots = [...(prev.slots || [])];
      const slot = { ...newSlots[slotIndex] };
      const current = Array.isArray(slot.allowedOptions)
        ? [...slot.allowedOptions]
        : [];

      const existsIndex = current.indexOf(optionId);
      if (existsIndex >= 0) {
        current.splice(existsIndex, 1);
      } else {
        current.push(optionId);
      }

      slot.allowedOptions = current;
      newSlots[slotIndex] = slot;
      return { ...prev, slots: newSlots };
    });
  };

  const startNewCombo = () => {
    setEditingCombo(createEmptyCombo());
  };

  const startEditCombo = (combo) => {
    setEditingCombo({
      id: combo.id,
      name: combo.name || "",
      description: combo.description || "",
      basePrice: combo.basePrice ?? combo.price ?? 0,
      mainCategory: combo.mainCategory || "Combos",
      station: combo.station || "cocina",
      type: "combo",
      isActive: combo.isActive !== false,
      slots: Array.isArray(combo.slots) ? combo.slots : [],
    });
  };

  const handleSaveCombo = async () => {
    if (!editingCombo) return;

    const name = editingCombo.name.trim();
    if (!name) {
      toast.error("El combo necesita un nombre");
      return;
    }

    const basePriceNum = Number(editingCombo.basePrice);
    // VALIDACIÓN CORREGIDA: DEBE SER MAYOR A 0
    if (Number.isNaN(basePriceNum) || basePriceNum <= 0) {
      toast.error("El precio base debe ser mayor a 0");
      return;
    }

    const normalizedSlots = (editingCombo.slots || []).map((slot, index) => ({
      id: slot.id || `slot_${index + 1}`,
      label: slot.label?.trim() || `Componente ${index + 1}`,
      type: slot.type || "side",
      includedPrice: Number(slot.includedPrice) || 0,
      allowedOptions: Array.isArray(slot.allowedOptions)
        ? slot.allowedOptions
        : [],
    }));

    const payload = {
      name,
      description: editingCombo.description?.trim() || "",
      mainCategory: editingCombo.mainCategory || "Combos",
      station: editingCombo.station || "cocina",
      type: "combo",
      isCombo: true,
      isActive: editingCombo.isActive !== false,
      basePrice: basePriceNum,
      price: basePriceNum,
      slots: normalizedSlots,
    };

    try {
      setSaving(true);
      if (editingCombo.id) {
        await updateDoc(doc(db, "menuItems", editingCombo.id), payload);
        toast.success("Combo actualizado");
      } else {
        await addDoc(collection(db, "menuItems"), payload);
        toast.success("Combo creado");
      }

      // Recargar lista
      const combosSnap = await getDocs(
        query(collection(db, "menuItems"), where("type", "==", "combo"))
      );
      const updated = combosSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setCombos(updated);

      setEditingCombo(null);
    } catch (e) {
      console.error("Error guardando combo:", e);
      toast.error("No se pudo guardar el combo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-slate-500 animate-pulse">
        Cargando combos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-900/20">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Combos y Promociones
            </h2>
            <p className="text-xs text-slate-400">
              Define la composición de cada combo, sus precios y reglas.
            </p>
          </div>
        </div>

        <button
          onClick={startNewCombo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-900/30 transition-all hover:scale-105"
        >
          <Plus size={18} />
          Nuevo Combo
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {combos.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No hay combos configurados todavía.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-xs uppercase text-slate-500 font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left">Nombre</th>
                <th className="px-6 py-4 text-left hidden sm:table-cell">
                  Descripción
                </th>
                <th className="px-6 py-4 text-center">Componentes</th>
                <th className="px-6 py-4 text-right">Precio Base</th>
                <th className="px-6 py-4 text-right">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {combos.map((combo) => (
                <tr key={combo.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-200">
                    {combo.name}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs hidden sm:table-cell max-w-xs truncate">
                    {combo.description || "—"}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-400">
                    <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
                        {Array.isArray(combo.slots) ? combo.slots.length : 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-orange-400">
                    ${(combo.basePrice ?? combo.price ?? 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                        combo.isActive !== false
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {combo.isActive !== false ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => startEditCombo(combo)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                    >
                      <Edit3 size={14} />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingCombo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-orange-500 font-bold mb-1">
                  Configuración
                </p>
                <h3 className="text-xl font-black text-white">
                  {editingCombo.id ? "Editar Combo" : "Nuevo Combo"}
                </h3>
              </div>
              <button
                onClick={() => setEditingCombo(null)}
                className="text-slate-400 hover:text-white rounded-full p-2 hover:bg-slate-800 transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Nombre del combo
                  </label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={editingCombo.name}
                    onChange={(e) =>
                      setEditingCombo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ej: Combo Familiar Pizza + Bebidas"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Precio base ($)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                    value={editingCombo.basePrice}
                    onChange={(e) =>
                      setEditingCombo((prev) => ({
                        ...prev,
                        basePrice: e.target.value,
                      }))
                    }
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Descripción (opcional)
                </label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none transition-all"
                  rows={2}
                  value={editingCombo.description}
                  onChange={(e) =>
                    setEditingCombo((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Texto que ayude a la recepción a entender qué incluye este combo."
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Layers size={16} className="text-orange-500" />
                  Componentes del combo
                </h4>
                <button
                  onClick={handleAddSlot}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Plus size={14} />
                  Agregar componente
                </button>
              </div>

              {(!editingCombo.slots || editingCombo.slots.length === 0) && (
                <div className="p-6 border border-dashed border-slate-700 rounded-xl text-center text-slate-500 text-xs">
                  Añade al menos un componente (slot) para este combo.
                </div>
              )}

             <div className="space-y-4">
                {(editingCombo.slots || []).map((slot, index) => { 
                  const allowedList =
                    slot.type === "side"
                      ? sides
                      : slot.type === "drink"
                      ? drinks
                      : [];

                  const allowedIds = Array.isArray(slot.allowedOptions)
                    ? slot.allowedOptions
                    : [];

                  return (
                    <div
                      key={slot.id || `slot-${index}`}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm relative group hover:border-slate-700 transition-colors"
                    >
                        <div className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                            onClick={() => handleRemoveSlot(index)}
                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg p-1.5 transition-colors"
                            >
                            <Trash2 size={16} />
                            </button>
                        </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pr-8">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Etiqueta
                          </label>
                          <input
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                            value={slot.label || ""}
                            onChange={(e) =>
                              handleUpdateSlot(index, {
                                label: e.target.value,
                              })
                            }
                            placeholder="Ej: Bebida"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Tipo
                          </label>
                          <select
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                            value={slot.type || "side"}
                            onChange={(e) =>
                              handleUpdateSlot(index, {
                                type: e.target.value,
                                allowedOptions: [],
                              })
                            }
                          >
                            {SLOT_TYPES.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Precio incluido ($)
                          </label>
                          <input
                            type="number"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                            value={slot.includedPrice ?? 0}
                            onChange={(e) =>
                              handleUpdateSlot(index, {
                                includedPrice: e.target.value,
                              })
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      {(slot.type === "side" || slot.type === "drink") && (
                        <div className="pt-3 border-t border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">
                            Opciones permitidas
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {allowedList.map((opt) => {
                              const active = allowedIds.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() =>
                                    handleToggleAllowedOption(index, opt.id)
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    active
                                      ? "bg-orange-500/20 text-orange-200 border-orange-500/50"
                                      : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                                  }`}
                                >
                                  {opt.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-3 text-sm text-slate-300 cursor-pointer select-none">
                  <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={editingCombo.isActive !== false}
                        onChange={(e) =>
                        setEditingCombo((prev) => ({
                            ...prev,
                            isActive: e.target.checked,
                        }))
                        }
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </div>
                  <span>Combo activo y visible</span>
                </label>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-5 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
              <button
                onClick={() => setEditingCombo(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCombo}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-900/20 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              >
                <Save size={18} />
                {saving ? "Guardando..." : "Guardar Combo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}