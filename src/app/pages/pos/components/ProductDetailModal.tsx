import React, { useState, useEffect } from 'react';
import type { MenuItem } from '../../../../models/MenuItem';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { usePOS } from '../../../../hooks/usePOS';

interface Props {
    product: MenuItem | null;
    onClose: () => void;
}

export const ProductDetailModal: React.FC<Props> = ({ product, onClose }) => {
    const { addToCart } = usePOS();
    const [quantity, setQuantity] = useState(1);
    const [comment, setComment] = useState('');
    // Aquí se cargarían opciones reales desde OptionsRepository en Fase 3
    // Por ahora usamos un mock visual para cumplir la UI de Fase 2
    
    useEffect(() => {
        if (product) {
            setQuantity(1);
            setComment('');
        }
    }, [product]);

    if (!product) return null;

    const handleAdd = () => {
        addToCart({
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            unitPrice: product.price,
            totalPrice: product.price * quantity,
            comment: comment.trim() || undefined,
            selectedOptions: [], // Vacío en esta fase
            isCombo: false
        });
        onClose();
    };

    return (
        <Modal 
            isOpen={!!product} 
            onClose={onClose} 
            title={product.name}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleAdd}>Agregar ${(product.price * quantity).toFixed(2)}</Button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cantidad</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Button variant="outline" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{quantity}</span>
                        <Button variant="outline" onClick={() => setQuantity(q => q + 1)}>+</Button>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notas para Cocina</label>
                    <textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Sin cebolla, bien cocido, etc."
                        style={{ width: '100%', height: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                    />
                </div>
            </div>
        </Modal>
    );
};