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
import { Plus, Trash2, Save, Edit3, Layers } from "lucide-react";
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

  // =========================
  // Carga inicial
  // =========================
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        // Combos guardados en menuItems con type === "combo"
        const combosSnap = await getDocs(
          query(collection(db, "menuItems"), where("type", "==", "combo"))
        );
        const loadedCombos = combosSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCombos(loadedCombos);

        // Complementos (sides)
        const sidesSnap = await getDocs(collection(db, "sides"));
        setSides(
          sidesSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );

        // Bebidas
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

  // =========================
  // Helpers de slots
  // =========================
  const handleAddSlot = () => {
    if (!editingCombo) return;
    const newSlot = {
      id: createSlotId(),
      label: "Nuevo componente",
      type: "side",
      includedPrice: 0,
      allowedOptions: [],
    };
    setEditingCombo({
      ...editingCombo,
      slots: [...(editingCombo.slots || []), newSlot],
    });
  };

  const handleUpdateSlot = (index, patch) => {
    if (!editingCombo) return;
    const slots = [...(editingCombo.slots || [])];
    slots[index] = { ...slots[index], ...patch };
    setEditingCombo({ ...editingCombo, slots });
  };

  const handleRemoveSlot = (index) => {
    if (!editingCombo) return;
    const slots = [...(editingCombo.slots || [])];
    slots.splice(index, 1);
    setEditingCombo({ ...editingCombo, slots });
  };

  const handleToggleAllowedOption = (slotIndex, optionId) => {
    if (!editingCombo) return;
    const slots = [...(editingCombo.slots || [])];
    const slot = { ...slots[slotIndex] };
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
    slots[slotIndex] = slot;
    setEditingCombo({ ...editingCombo, slots });
  };

  // =========================
  // CRUD Combos
  // =========================
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
    if (Number.isNaN(basePriceNum) || basePriceNum < 0) {
      toast.error("Precio base inválido");
      return;
    }

    if (!editingCombo.slots || editingCombo.slots.length === 0) {
      if (
        !window.confirm(
          "Este combo no tiene componentes configurados. ¿Guardar de todos modos?"
        )
      ) {
        return;
      }
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
      price: basePriceNum, // para compatibilidad con la UI de menú actual
      slots: normalizedSlots,
    };

    try {
      setSaving(true);
      if (editingCombo.id) {
        await updateDoc(doc(db, "menuItems", editingCombo.id), payload);
        toast.success("Combo actualizado");
      } else {
        const ref = await addDoc(collection(db, "menuItems"), payload);
        toast.success("Combo creado");
        payload.id = ref.id;
      }

      // Recargar lista
      const combosSnap = await getDocs(
        query(collection(db, "menuItems"), where("type", "==", "combo"))
      );
      const updated = combosSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setCombos(updated);

      setEditingCombo(null);
    } catch (e) {
      console.error("Error guardando combo:", e);
      toast.error("No se pudo guardar el combo");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // Render
  // =========================
  if (loading) {
    return (
      <div className="py-10 text-center text-slate-400">
        Cargando combos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Combos y Promociones
            </h2>
            <p className="text-xs text-slate-500">
              Define la composición de cada combo, sus precios y reglas.
            </p>
          </div>
        </div>

        <button
          onClick={startNewCombo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} />
          Nuevo Combo
        </button>
      </div>

      {/* Lista de combos */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {combos.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No hay combos configurados todavía. Crea el primero con el botón
            "Nuevo Combo".
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left hidden sm:table-cell">
                  Descripción
                </th>
                <th className="px-4 py-2 text-center">Componentes</th>
                <th className="px-4 py-2 text-right">Precio Base</th>
                <th className="px-4 py-2 text-right">Estado</th>
                <th className="px-4 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combos.map((combo) => (
                <tr key={combo.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2 font-semibold text-slate-800">
                    {combo.name}
                  </td>
                  <td className="px-4 py-2 text-slate-500 text-xs hidden sm:table-cell">
                    {combo.description || "—"}
                  </td>
                  <td className="px-4 py-2 text-center text-slate-600">
                    {Array.isArray(combo.slots) ? combo.slots.length : 0}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-slate-800">
                    ${(combo.basePrice ?? combo.price ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-semibold ${
                        combo.isActive !== false
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {combo.isActive !== false ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => startEditCombo(combo)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
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

      {/* Editor modal */}
      {editingCombo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                  Configurar combo
                </p>
                <h3 className="text-lg font-black text-slate-900">
                  {editingCombo.id ? "Editar combo" : "Nuevo combo"}
                </h3>
              </div>
              <button
                onClick={() => setEditingCombo(null)}
                className="text-slate-400 hover:text-slate-700 rounded-full p-2 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Datos básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Nombre del combo
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/80"
                    value={editingCombo.name}
                    onChange={(e) =>
                      setEditingCombo({
                        ...editingCombo,
                        name: e.target.value,
                      })
                    }
                    placeholder="Ej: Combo Familiar Pizza + Bebidas"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Precio base ($)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/80"
                    value={editingCombo.basePrice}
                    onChange={(e) =>
                      setEditingCombo({
                        ...editingCombo,
                        basePrice: e.target.value,
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Descripción (opcional)
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/80 resize-none"
                  rows={2}
                  value={editingCombo.description}
                  onChange={(e) =>
                    setEditingCombo({
                      ...editingCombo,
                      description: e.target.value,
                    })
                  }
                  placeholder="Texto que ayude a la recepción a entender qué incluye este combo."
                />
              </div>

              {/* Slots */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">
                  Componentes del combo
                </h4>
                <button
                  onClick={handleAddSlot}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-slate-700"
                >
                  <Plus size={14} />
                  Agregar componente
                </button>
              </div>

              {(!editingCombo.slots || editingCombo.slots.length === 0) && (
                <p className="text-xs text-slate-400">
                  Añade al menos un componente: pizzas, complementos o bebidas.
                </p>
              )}

              <div className="space-y-3">
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
                      key={slot.id || index}
                      className="border border-slate-200 rounded-2xl p-4 bg-slate-50"
                    >
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">
                              Etiqueta visible
                            </label>
                            <input
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/80"
                              value={slot.label || ""}
                              onChange={(e) =>
                                handleUpdateSlot(index, {
                                  label: e.target.value,
                                })
                              }
                              placeholder="Ej: Pizza grande, Bebida, Complemento"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">
                              Tipo de componente
                            </label>
                            <select
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/80"
                              value={slot.type || "side"}
                              onChange={(e) =>
                                handleUpdateSlot(index, {
                                  type: e.target.value,
                                  // al cambiar de tipo, los allowedOptions pueden no aplicar
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
                            <label className="text-[11px] font-bold text-slate-500 uppercase">
                              Precio incluido ($)
                            </label>
                            <input
                              type="number"
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/80"
                              value={slot.includedPrice ?? 0}
                              onChange={(e) =>
                                handleUpdateSlot(index, {
                                  includedPrice: e.target.value,
                                })
                              }
                              min="0"
                              step="0.01"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                              Si el cliente cambia a algo más caro, se cobrará
                              la diferencia contra este valor.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveSlot(index)}
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Opciones permitidas */}
                      {slot.type === "side" || slot.type === "drink" ? (
                        <div className="mt-2">
                          <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                            Opciones permitidas
                          </p>
                          {allowedList.length === 0 ? (
                            <p className="text-xs text-slate-400">
                              No hay elementos configurados para este tipo.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {allowedList.map((opt) => {
                                const active = allowedIds.includes(opt.id);
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                      handleToggleAllowedOption(
                                        index,
                                        opt.id
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${
                                      active
                                        ? "bg-orange-500 text-white border-orange-500"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-orange-400 hover:text-orange-600"
                                    }`}
                                  >
                                    {opt.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-[10px] text-slate-500 mt-1">
                            Si no seleccionas ninguna, el combo permitirá{" "}
                            <span className="font-semibold">
                              cualquier {slot.type === "side"
                                ? "complemento"
                                : "bebida"}
                            </span>{" "}
                            activo.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Para las pizzas clásicas, las opciones se configuran
                          al momento de tomar la orden (ingredientes, etc.). No
                          necesitas limitar aquí.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Estado */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    checked={editingCombo.isActive !== false}
                    onChange={(e) =>
                      setEditingCombo({
                        ...editingCombo,
                        isActive: e.target.checked,
                      })
                    }
                  />
                  <span>Combo activo (visible en recepción)</span>
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
              <button
                onClick={() => setEditingCombo(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCombo}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {saving ? "Guardando..." : "Guardar combo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
