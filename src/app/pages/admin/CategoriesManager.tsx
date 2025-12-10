import React, { useState } from 'react';
import { useMenu } from '../../../hooks/useMenu';
import { CategoryRepository } from '../../../repos/CategoryRepository';
import { DataTable } from './components/DataTable';
import type { Category } from '../../../models/Category';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const CategoriesManager: React.FC = () => {
    const { categories, reload } = useMenu();
    const repo = new CategoryRepository();
    const [editing, setEditing] = useState<Partial<Category> | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = async () => {
        if (!editing || !editing.name) return;
        if (editing.id) await repo.update(editing.id, editing);
        else await repo.create({ ...editing, order: categories.length + 1 } as Category);
        await reload();
        setIsOpen(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1>Categorías</h1>
                <Button onClick={() => { setEditing({}); setIsOpen(true); }}>+ Nueva</Button>
            </div>
            <DataTable 
                data={categories}
                columns={[
                    { header: 'Orden', accessor: 'order', width: '50px' },
                    { header: 'Nombre', accessor: 'name' },
                    { header: 'ID Referencia', accessor: 'id' }
                ]}
                onEdit={(item) => { setEditing(item); setIsOpen(true); }}
            />
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Categoría">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input className="input-field" placeholder="Nombre Categoría" value={editing?.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} />
                    <input className="input-field" type="number" placeholder="Orden" value={editing?.order || ''} onChange={e => setEditing({...editing, order: parseInt(e.target.value)})} />
                    <Button onClick={handleSave}>Guardar</Button>
                </div>
            </Modal>
        </div>
    );
};