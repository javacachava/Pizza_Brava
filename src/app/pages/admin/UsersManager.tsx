import React, { useEffect, useState } from 'react';
import { UsersAdminService } from '../../../services/domain/UsersAdminService';
import type { User } from '../../../models/User';
import { DataTable } from './components/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const svc = new UsersAdminService();

export const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<Partial<User> | null>(null);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');

  const load = async () => setUsers(await svc.listAll());

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (editing.id) {
      await svc.updateUser(editing.id, editing as User);
    } else {
      // create: require password
      if (!editing.email || !password) { alert('Email y password requeridos'); return; }
      await svc.createUser(editing.email, password, editing.name || editing.email, editing.role as any);
    }
    await load();
    setOpen(false);
    setEditing(null);
    setPassword('');
  };

  const toggleActive = async (u: User) => {
    await svc.toggleActive(u.id, !u.isActive);
    await load();
  };

  const resetPassword = async (u: User) => {
    if (!u.email) return alert('Usuario sin email');
    await svc.resetPassword(u.email);
    alert('Email de reset enviado (si existe)');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1>Usuarios</h1>
        <Button onClick={() => { setEditing({}); setOpen(true); }}>+ Nuevo Usuario</Button>
      </div>

      <DataTable 
        data={users}
        columns={[
          { header: 'Nombre', accessor: (i: User) => i.name },
          { header: 'Email', accessor: 'email' },
          { header: 'Rol', accessor: 'role' },
          { header: 'Activo', accessor: (i: User) => i.isActive ? 'Sí' : 'No' }
        ]}
        onEdit={(u) => { setEditing(u); setOpen(true); }}
        onToggleActive={(u) => toggleActive(u as User)}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing?.id ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Nombre" value={editing?.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} />
          <input placeholder="Email" value={editing?.email || ''} onChange={e => setEditing({...editing, email: e.target.value})} />
          <select value={editing?.role || 'cashier'} onChange={e => setEditing({...editing, role: e.target.value as any})}>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cajero</option>
            <option value="kitchen">Cocina</option>
            <option value="waiter">Mesero</option>
          </select>
          {!editing?.id && (
            <input type="password" placeholder="Contraseña inicial" value={password} onChange={e => setPassword(e.target.value)} />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={save}>Guardar</Button>
            {editing?.id && <Button variant="outline" onClick={() => resetPassword(editing as User)}>Reset Password</Button>}
          </div>
        </div>
      </Modal>
    </div>
  );
};
