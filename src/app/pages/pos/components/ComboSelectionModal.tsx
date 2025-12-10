import React, { useEffect, useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { ComboService } from '../../../../services/domain/ComboService';
import type { ComboDefinition } from '../../../../models/Combo';
import type { OrderItem } from '../../../../models/OrderItem';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    comboId: string | null;
    addToCart: (item: OrderItem) => void;
}

export const ComboSelectionModal: React.FC<Props> = ({ isOpen, onClose, comboId, addToCart }) => {
    const [combo, setCombo] = useState<ComboDefinition | null>(null);
    const [selection, setSelection] = useState<{ slotId: string; productId: string; quantity: number }[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Service instance
    const comboService = new ComboService();

    useEffect(() => {
        if (isOpen && comboId) {
            setLoading(true);
            comboService.getById(comboId).then(c => {
                setCombo(c);
                setSelection([]);
                setLoading(false);
            }).catch(() => setLoading(false));
        } else {
            setCombo(null);
            setSelection([]);
        }
    }, [isOpen, comboId]);

    const handleConfirm = async () => {
        if (!combo) return;
        setLoading(true);
        const validation = await comboService.validateCombo(combo.id, selection);
        if (!validation.valid) { 
            alert('Errores:\n' + validation.errors.join('\n')); 
            setLoading(false); 
            return; 
        }

        try {
            const orderItem = await comboService.buildOrderItemFromCombo(combo.id, selection, 1);
            addToCart(orderItem as any);
            onClose();
        } catch (e) { 
            console.error(e);
            alert('Error creando combo'); 
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={combo ? combo.name : 'Cargando...'} 
        >
            {combo ? (
                <div>
                    <p style={{marginBottom: 16}}>{combo.description}</p>

                    {(combo.slots || []).map((slot) => (
                        <div key={slot.id} style={{ border: '1px solid #eee', padding: 12, marginBottom: 12, borderRadius: 6 }}>
                            <div style={{fontWeight: 'bold', marginBottom: 8}}>
                                {slot.name} 
                                <span style={{fontWeight: 'normal', fontSize: '0.9em', color: '#666', marginLeft: 6}}>
                                    {slot.required === 'required' ? '(Requerido)' : '(Opcional)'} • Min: {slot.min} • Max: {slot.max}
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', backgroundColor: '#fafafa', padding: 8, borderRadius: 4 }}>
                                <small style={{ color: 'gray' }}>
                                    (Funcionalidad de selección de productos pendiente de implementación de UI)
                                    <br/>
                                    IDs permitidos: {slot.allowedProductIds?.join(', ') || 'Todos'}
                                </small>
                            </div>
                        </div>
                    ))}

                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleConfirm} disabled={loading || !combo}>{loading ? 'Agregando...' : 'Agregar combo'}</Button>
                    </div>
                </div>
            ) : (
                <div style={{padding: 20, textAlign: 'center'}}>Cargando información del combo...</div>
            )}
        </Modal>
    );
};