import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Plus, Trash, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminCombos() {
  const [combos, setCombos] = useState([]);
  const [sides, setSides] = useState([]);
  const [editingCombo, setEditingCombo] = useState(null);

  useEffect(() => {
    // Cargar datos auxiliares para los selectores
    const loadData = async () => {
        const sSnap = await getDocs(collection(db, "sides"));
        setSides(sSnap.docs.map(d => ({id: d.id, ...d.data()})));
        
        const cSnap = await getDocs(collection(db, "menuItems")); // Filtra solo combos en tu query real
        const allItems = cSnap.docs.map(d => ({id: d.id, ...d.data()}));
        setCombos(allItems.filter(i => i.type === 'combo'));
    };
    loadData();
  }, []);

  const handleAddSlot = () => {
    setEditingCombo(prev => ({
        ...prev,
        slots: [...(prev.slots || []), { id: Date.now(), type: 'side', label: 'Nuevo Slot', includedPrice: 0, allowedOptions: [] }]
    }));
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...editingCombo.slots];
    newSlots[index][field] = value;
    setEditingCombo({...editingCombo, slots: newSlots});
  };

  const handleSave = async () => {
      try {
          const docRef = editingCombo.id ? doc(db, "menuItems", editingCombo.id) : collection(db, "menuItems");
          const payload = { ...editingCombo, type: 'combo', mainCategory: 'Combos' };
          
          if(editingCombo.id) await updateDoc(docRef, payload);
          else await addDoc(docRef, payload);
          
          toast.success("Combo Guardado");
          setEditingCombo(null);
      } catch(e) { toast.error("Error al guardar"); }
  };

  return (
    <div className="p-6">
      {!editingCombo ? (
        <div>
            <div className="flex justify-between mb-4">
                <h2 className="text-2xl font-bold">Administrar Combos</h2>
                <button onClick={() => setEditingCombo({ name: '', basePrice: 0, slots: [] })} className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2"><Plus/> Nuevo Combo</button>
            </div>
            <div className="grid gap-4">
                {combos.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded shadow border flex justify-between">
                        <span className="font-bold">{c.name}</span>
                        <button onClick={() => setEditingCombo(c)} className="text-blue-600 underline">Editar</button>
                    </div>
                ))}
            </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow-lg max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Editando: {editingCombo.name || 'Nuevo'}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-bold">Nombre Combo</label>
                    <input className="border p-2 w-full rounded" value={editingCombo.name} onChange={e => setEditingCombo({...editingCombo, name: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-bold">Precio Base ($)</label>
                    <input type="number" className="border p-2 w-full rounded" value={editingCombo.basePrice} onChange={e => setEditingCombo({...editingCombo, basePrice: parseFloat(e.target.value)})} />
                </div>
            </div>

            <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold">Slots (Componentes del Combo)</h3>
                    <button onClick={handleAddSlot} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded font-bold">+ Agregar Slot</button>
                </div>
                
                {editingCombo.slots?.map((slot, idx) => (
                    <div key={idx} className="border p-4 rounded bg-slate-50 relative">
                        <button onClick={() => {
                            const n = [...editingCombo.slots]; n.splice(idx,1); setEditingCombo({...editingCombo, slots: n});
                        }} className="absolute top-2 right-2 text-red-500"><Trash size={16}/></button>
                        
                        <div className="grid grid-cols-3 gap-3 mb-2">
                            <input placeholder="Etiqueta (ej: Bebida)" className="border p-1 rounded" value={slot.label} onChange={e => updateSlot(idx, 'label', e.target.value)} />
                            <select className="border p-1 rounded" value={slot.type} onChange={e => updateSlot(idx, 'type', e.target.value)}>
                                <option value="side">Complemento</option>
                                <option value="drink">Bebida</option>
                                <option value="pizza_classic">Pizza Clásica</option>
                            </select>
                            <input type="number" placeholder="Precio Incluido (Snapshot)" className="border p-1 rounded" value={slot.includedPrice} onChange={e => updateSlot(idx, 'includedPrice', parseFloat(e.target.value))} />
                        </div>

                        {slot.type === 'side' && (
                            <div className="mt-2">
                                <label className="text-xs font-bold block mb-1">Opciones Permitidas (IDs separados por coma)</label>
                                <select multiple className="w-full border h-20 text-xs" value={slot.allowedOptions || []} onChange={e => {
                                    const opts = Array.from(e.target.selectedOptions, option => option.value);
                                    updateSlot(idx, 'allowedOptions', opts);
                                }}>
                                    {sides.map(s => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
                                </select>
                                <p className="text-[10px] text-slate-500">Mantén Ctrl para seleccionar múltiples. Estos son los items que el usuario puede elegir.</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-3">
                <button onClick={() => setEditingCombo(null)} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded flex items-center gap-2"><Save size={16}/> Guardar Combo</button>
            </div>
        </div>
      )}
    </div>
  );
}