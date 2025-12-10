import React, { useEffect, useState } from 'react';
import { CombosRepository } from '../../../repos/CombosRepository';
import type { ComboDefinition, ComboGroupDef } from '../../../models/ComboDefinition';
import { DataTable } from './components/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const repo = new CombosRepository();

export const CombosManager: React.FC = () => {
  const [combos, setCombos] = useState<ComboDefinition[]>([]);
  const [editing, setEditing] = useState<Partial<ComboDefinition> | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => setCombos(await repo.getAll());
  useEffect(() => { load(); }, []);

  const addGroup = () => {
    const g: ComboGroupDef = { id: `g_${Date.now()}`, title: 'Nuevo Grupo', required: true, limit: 1, allowedCategoryIds: [], allowedProductIds: [] };
    setEditing(prev => ({ ...(prev || {}), groups: [...(prev?.groups || []), g] }));
  };

  const save = async () => {
    if (!editing) return;
    const payload: any = {
      name: editing.name,
      basePrice: editing.basePrice || 0,
      isActive: editing.isActive ?? true,
      description: editing.description || '',
      groups: editing.groups || []
    };
    if (editing.id) await repo.update(editing.id, payload);
    else await repo.create(payload);
    await load(); setOpen(false); setEditing(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1>Combos</h1>
        <Button onClick={() => { setEditing({ groups: [] }); setOpen(true); }}>+ Nuevo Combo</Button>
      </div>

      <DataTable
        data={combos}
        columns={[
          { header: 'Nombre', accessor: 'name' },
          { header: 'Precio Base', accessor: (c: ComboDefinition) => `$${(c.basePrice||0).toFixed(2)}` },
          { header: 'Grupos', accessor: (c: ComboDefinition) => (c.groups?.length || 0) }
        ]}
        onEdit={(c) => { setEditing(c); setOpen(true); }}
        onToggleActive={(c) => repo.update(c.id, { isActive: !c.isActive })}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing?.id ? 'Editar Combo' : 'Nuevo Combo'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Nombre" value={editing?.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} />
          <input type="number" placeholder="Precio Base" value={editing?.basePrice ?? ''} onChange={e => setEditing({...editing, basePrice: parseFloat(e.target.value || '0')})} />
          <textarea placeholder="Descripción" value={editing?.description || ''} onChange={e => setEditing({...editing, description: e.target.value})} />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <strong>Grupos</strong>
              <Button variant="outline" onClick={addGroup}>+ Grupo</Button>
            </div>
            {(editing?.groups || []).map((g, idx) => (
              <div key={g.id || idx} style={{ border: '1px solid #eee', padding: 8, marginBottom: 6 }}>
                <input placeholder="Título" value={g.title} onChange={e => {
                  setEditing(prev => {
                    if (!prev) return null;
                    const newGroups = (prev.groups || []).map((gg, i) => i === idx ? { ...gg, title: e.target.value } : gg);
                    return { ...prev, groups: newGroups };
                  });
                }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <label><input type="checkbox" checked={g.required} onChange={e => {
                    setEditing(prev => {
                      if (!prev) return null;
                      const newGroups = (prev.groups || []).map((gg, i) => i === idx ? { ...gg, required: e.target.checked } : gg);
                      return { ...prev, groups: newGroups };
                    });
                  }} /> Requerido</label>
                  <input type="number" value={g.limit} onChange={e => {
                    setEditing(prev => {
                      if (!prev) return null;
                      const newGroups = (prev.groups || []).map((gg, i) => i === idx ? { ...gg, limit: parseInt(e.target.value || '1') } : gg);
                      return { ...prev, groups: newGroups };
                    });
                  }} />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={save}>Guardar Combo</Button>
        </div>
      </Modal>
    </div>
  );
};
