import React, { useEffect, useState } from 'react';
import { FlavorsRepository } from '../../../repos/FlavorsRepository';
import type { Flavor } from '../../../models/Flavor';
import { DataTable } from './components/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const repo = new FlavorsRepository();

export const FlavorsManager: React.FC = () => {
  const [data, setData] = useState<Flavor[]>([]);
  const [edit, setEdit] = useState<Partial<Flavor> | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => setData(await repo.getAllOrdered());
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit) return;
    if (edit.id) await repo.update(edit.id, edit);
    else await repo.create({ ...(edit as Flavor), name: edit.name || 'Nuevo', isActive: true } as any);
    await load(); setOpen(false); setEdit(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1>Sabores</h1>
        <Button onClick={() => { setEdit({}); setOpen(true); }}>+ Nuevo</Button>
      </div>

      <DataTable 
        data={data}
        columns={[{ header: 'Nombre', accessor: 'name' }, { header: 'Orden', accessor: 'order' }]}
        onEdit={(i) => { setEdit(i); setOpen(true); }}
        onToggleActive={(i) => repo.update(i.id, { isActive: !i.isActive })}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Sabor">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Nombre" value={edit?.name || ''} onChange={e => setEdit({...edit, name: e.target.value})} />
          <input type="number" placeholder="Orden" value={edit?.order || 0} onChange={e => setEdit({...edit, order: parseInt(e.target.value || '0')})} />
          <Button onClick={save}>Guardar</Button>
        </div>
      </Modal>
    </div>
  );
};
