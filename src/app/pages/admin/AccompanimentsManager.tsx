import React, { useEffect, useState } from 'react';
import { AccompanimentsRepository } from '../../../repos/AccompanimentsRepository';
import type { Accompaniment } from '../../../models/Accompaniment';
import { DataTable } from './components/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const repo = new AccompanimentsRepository();

export const AccompanimentsManager: React.FC = () => {
  const [list, setList] = useState<Accompaniment[]>([]);
  const [edit, setEdit] = useState<Partial<Accompaniment> | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => setList(await repo.getAll());
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit) return;
    const payload: any = { name: edit.name, price: edit.price || 0, isActive: edit.isActive ?? true };
    if (edit.id) await repo.update(edit.id, payload);
    else await repo.create(payload);
    await load(); setOpen(false); setEdit(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1>Acompañamientos</h1>
        <Button onClick={() => { setEdit({}); setOpen(true); }}>+ Nuevo</Button>
      </div>

      <DataTable
        data={list}
        columns={[{ header: 'Nombre', accessor: 'name' }, { header: 'Precio', accessor: (i: Accompaniment) => `$${(i.price||0).toFixed(2)}` }]}
        onEdit={(i) => { setEdit(i); setOpen(true); }}
        onToggleActive={(i) => repo.update(i.id, { isActive: !i.isActive })}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Acompañamiento">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Nombre" value={edit?.name || ''} onChange={e => setEdit({...edit, name: e.target.value})} />
          <input type="number" placeholder="Precio" value={edit?.price ?? ''} onChange={e => setEdit({...edit, price: parseFloat(e.target.value || '0')})} />
          <Button onClick={save}>Guardar</Button>
        </div>
      </Modal>
    </div>
  );
};
