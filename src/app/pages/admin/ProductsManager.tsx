import React, { useState } from 'react';
import { useMenu } from '../../../hooks/useMenu';
import { MenuRepository } from '../../../repos/MenuRepository';
import { DataTable } from './components/DataTable';
import type { MenuItem } from '../../../models/MenuItem';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const ProductsManager: React.FC = () => {
    const { categories, reload } = useMenu();
    const repo = new MenuRepository();
    
    const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Aplanamos productos para la tabla
    const allProducts = categories.flatMap(c => c.items);

    const handleSave = async () => {
        if (!editingItem || !editingItem.name || !editingItem.price) return;
        
        try {
            if (editingItem.id) {
                await repo.update(editingItem.id, editingItem);
            } else {
                // Nuevo producto: valores por defecto obligatorios
                await repo.create({
                    ...editingItem,
                    isAvailable: true,
                    usesIngredients: editingItem.usesIngredients || false,
                    usesFlavors: editingItem.usesFlavors || false,
                    usesSizeVariant: editingItem.usesSizeVariant || false,
                    comboEligible: editingItem.comboEligible ?? true
                } as MenuItem);
            }
            await reload();
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (e) {
            alert('Error guardando producto');
        }
    };

    const toggleStatus = async (item: MenuItem) => {
        await repo.update(item.id, { isAvailable: !item.isAvailable });
        reload();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1>Productos</h1>
                <Button onClick={() => { setEditingItem({}); setIsModalOpen(true); }}>+ Nuevo Producto</Button>
            </div>

            <DataTable 
                data={allProducts}
                onToggleActive={toggleStatus}
                onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                columns={[
                    { header: 'Nombre', accessor: 'name' },
                    { header: 'Precio ($)', accessor: (item) => item.price.toFixed(2) },
                    { header: 'Categoría', accessor: (item) => categories.find(c => c.id === item.categoryId)?.name || '---' },
                    { header: 'Flags', accessor: (item) => (
                        <div style={{ fontSize: '0.7rem', color: 'gray' }}>
                            {item.comboEligible && '🏷️Combo '}
                            {item.usesFlavors && '🍦Sabores '}
                        </div>
                    )}
                ]}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem?.id ? 'Editar Producto' : 'Nuevo Producto'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        className="input-field" 
                        placeholder="Nombre" 
                        value={editingItem?.name || ''} 
                        onChange={e => setEditingItem({...editingItem, name: e.target.value})} 
                    />
                    <select 
                        className="input-field"
                        value={editingItem?.categoryId || ''}
                        onChange={e => setEditingItem({...editingItem, categoryId: e.target.value})}
                    >
                        <option value="">Seleccionar Categoría</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input 
                        className="input-field" 
                        type="number" 
                        placeholder="Precio" 
                        value={editingItem?.price || ''} 
                        onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})} 
                    />
                    <textarea 
                        className="input-field"
                        placeholder="Descripción"
                        value={editingItem?.description || ''}
                        onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                    />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <label>
                            <input type="checkbox" checked={editingItem?.usesFlavors || false} onChange={e => setEditingItem({...editingItem, usesFlavors: e.target.checked})} />
                            Usa Sabores
                        </label>
                        <label>
                            <input type="checkbox" checked={editingItem?.comboEligible ?? true} onChange={e => setEditingItem({...editingItem, comboEligible: e.target.checked})} />
                            Elegible para Combos
                        </label>
                    </div>

                    <Button onClick={handleSave}>Guardar</Button>
                </div>
            </Modal>
        </div>
    );
};