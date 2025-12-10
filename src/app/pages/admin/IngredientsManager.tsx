import React, { useEffect, useState } from 'react';
import { IngredientRepository } from '../../../repos/IngredientRepository';
import type { Ingredient } from '../../../models/Ingredient';
import { DataTable } from './components/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const repo = new IngredientRepository();

export const IngredientsManager: React.FC = () => {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [editing, setEditing] = useState<Partial<Ingredient> | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => setItems(await repo.getAll());
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload: any = {
      name: editing.name,
      price: editing.price || 0,
      unit: editing.unit || 'unit',
      isAvailable: editing.isAvailable ?? true,
      stock: editing.stock ?? 0
    };
    if (editing.id) await repo.update(editing.id, payload);
    else await repo.create(payload);
    await load(); setOpen(false); setEditing(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1>Ingredientes</h1>
        <Button onClick={() => { setEditing({}); setOpen(true); }}>+ Nuevo</Button>
      </div>

      <DataTable
        data={items}
        columns={[
          { header: 'Nombre', accessor: 'name' },
          { header: 'Precio', accessor: (i: Ingredient) => `$${(i.price || 0).toFixed(2)}` },
          { header: 'Unidad', accessor: 'unit' },
          { header: 'Stock', accessor: (i: Ingredient) => i.stock ?? '-' }
        ]}
        onEdit={(i) => { setEditing(i); setOpen(true); }}
        onToggleActive={(i) => repo.update(i.id, { isAvailable: !(i.isAvailable ?? true) })}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Ingrediente">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Nombre" value={editing?.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} />
          <input type="number" placeholder="Precio" value={editing?.price ?? ''} onChange={e => setEditing({...editing, price: parseFloat(e.target.value || '0')})} />
          <select value={editing?.unit || 'unit'} onChange={e => setEditing({...editing, unit: e.target.value as any})}>
            <option value="unit">unit</option>
            <option value="g">g</option>
            <option value="ml">ml</option>
          </select>
          <input type="number" placeholder="Stock" value={editing?.stock ?? ''} onChange={e => setEditing({...editing, stock: parseInt(e.target.value || '0')})} />
          <Button onClick={save}>Guardar</Button>
        </div>
      </Modal>
    </div>
  );
};
