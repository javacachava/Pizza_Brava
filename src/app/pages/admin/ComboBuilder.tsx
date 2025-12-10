import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import type { ComboDefinition as Combo, ComboSlotDefinition as ComboSlot } from "../../../models/Combo";
import { ComboRepository } from "../../../repos/ComboRepository";
export const ComboBuilder: React.FC = () => {

    const repo = new ComboRepository();

    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<Combo> | null>(null);

    const newSlot = (): ComboSlot => ({
        id: crypto.randomUUID(),
        name: "",
        required: "required",
        min: 1,
        max: 1,
        allowedProductIds: []
    });

    const handleCreate = () => {
        setEditing({
            name: "",
            basePrice: 0,
            slots: []
        });
        setIsOpen(true);
    };

    const handleSave = async () => {
        if (!editing) return alert("No hay combo a guardar.");

        if (!editing.name || editing.name.trim() === "")
            return alert("El combo necesita un nombre.");

        if (!editing.slots || editing.slots.length === 0)
            return alert("Debe agregar al menos 1 slot.");

        for (const slot of editing.slots) {
            if (!slot.name.trim()) return alert("Todos los slots requieren nombre.");
            if ((slot.min ?? 1) > (slot.max ?? 1))
                return alert(`El slot "${slot.name}" tiene min > max.`);
        }

        try {
            if (editing.id) {
                await repo.update(editing.id, editing);
            } else {
                await repo.create(editing as Combo);
            }
            setIsOpen(false);
            setEditing(null);
            alert("Combo guardado correctamente.");
        } catch (err) {
            console.error(err);
            alert("Error guardando combo.");
        }
    };

    return (
        <div style={{ padding: 20 }}>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <h1>Combos</h1>
                <Button onClick={handleCreate}>+ Nuevo Combo</Button>
            </div>

            <div style={{ marginBottom: 20 }}>
                <Button onClick={() => alert("Aquí irá la tabla de combos existentes.")}>
                    Ver combos existentes
                </Button>
            </div>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={editing?.id ? "Editar Combo" : "Nuevo Combo"}
            >
                {editing && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                        <input
                            value={editing.name}
                            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                            placeholder="Nombre del combo"
                            style={{ padding: 8 }}
                        />

                        <input
                            type="number"
                            value={editing.basePrice ?? 0}
                            onChange={(e) =>
                                setEditing({
                                    ...editing,
                                    basePrice: parseFloat(e.target.value || "0"),
                                })
                            }
                            placeholder="Precio base"
                            style={{ padding: 8 }}
                        />

                        <div>
                            <h4>Slots</h4>

                            {(editing.slots || []).map((s, idx) => (
                                <div
                                    key={s.id}
                                    style={{
                                        border: "1px solid #eee",
                                        padding: 8,
                                        marginBottom: 8,
                                        borderRadius: 6,
                                    }}
                                >
                                    <input
                                        value={s.name}
                                        onChange={(e) => {
                                            const slots = [...(editing.slots || [])];
                                            slots[idx] = { ...slots[idx], name: e.target.value };
                                            setEditing({ ...editing, slots });
                                        }}
                                        placeholder="Nombre del slot (Ej: Pizza, Bebida...)"
                                        style={{ width: "100%", padding: 6 }}
                                    />

                                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                        <label>
                                            Requerido
                                            <input
                                                type="checkbox"
                                                checked={s.required === "required"}
                                                onChange={(e) => {
                                                    const slots = [...(editing.slots || [])];
                                                    slots[idx] = {
                                                        ...slots[idx],
                                                        required: e.target.checked
                                                            ? "required"
                                                            : "optional",
                                                    };
                                                    setEditing({ ...editing, slots });
                                                }}
                                            />
                                        </label>

                                        <label>
                                            Min
                                            <input
                                                type="number"
                                                value={s.min}
                                                style={{ width: 60 }}
                                                onChange={(e) => {
                                                    const slots = [...(editing.slots || [])];
                                                    slots[idx] = {
                                                        ...slots[idx],
                                                        min: parseInt(e.target.value || "1"),
                                                    };
                                                    setEditing({ ...editing, slots });
                                                }}
                                            />
                                        </label>

                                        <label>
                                            Max
                                            <input
                                                type="number"
                                                value={s.max}
                                                style={{ width: 60 }}
                                                onChange={(e) => {
                                                    const slots = [...(editing.slots || [])];
                                                    slots[idx] = {
                                                        ...slots[idx],
                                                        max: parseInt(e.target.value || "1"),
                                                    };
                                                    setEditing({ ...editing, slots });
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {/* Allowed products */}
                                    <div style={{ marginTop: 8 }}>
                                        <label>Allowed product IDs</label>
                                        <input
                                            style={{ width: "100%", padding: 6 }}
                                            value={s.allowedProductIds?.join(",") || ""}
                                            onChange={(e) => {
                                                const ids = e.target.value
                                                    .split(",")
                                                    .map((x) => x.trim())
                                                    .filter(Boolean);

                                                const slots = [...(editing.slots || [])];
                                                slots[idx] = {
                                                    ...slots[idx],
                                                    allowedProductIds: ids,
                                                };
                                                setEditing({ ...editing, slots });
                                            }}
                                            placeholder="Ej: p1,p2,p3"
                                        />
                                    </div>

                                    <div style={{ marginTop: 8 }}>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const slots = (editing.slots || []).filter(
                                                    (_, i) => i !== idx
                                                );
                                                setEditing({ ...editing, slots });
                                            }}
                                        >
                                            Eliminar slot
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            <Button
                                onClick={() =>
                                    setEditing({
                                        ...editing,
                                        slots: [...(editing.slots || []), newSlot()],
                                    })
                                }
                                style={{ marginTop: 10 }}
                            >
                                + Agregar slot
                            </Button>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <Button onClick={handleSave}>Guardar Combo</Button>
                            <Button variant="secondary" onClick={() => setIsOpen(false)}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
