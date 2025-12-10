import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { usePOS } from '../../../../hooks/usePOS';
import { useAuth } from '../../../../hooks/useAuth';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const OrderTypeModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { placeOrder, total } = usePOS();
    const { user } = useAuth();
    const [step, setStep] = useState<'type' | 'details'>('type');
    const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
    
    // Formulario
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const reset = () => {
        setStep('type');
        setCustomerName('');
        setPhone('');
        setAddress('');
        setTableNumber('');
        onClose();
    };

    const handleTypeSelect = (type: 'dine-in' | 'takeaway' | 'delivery') => {
        setOrderType(type);
        setStep('details');
    };

    const handleConfirm = async () => {
        // Validaciones simples
        if (orderType === 'delivery' && (!phone || !address)) {
            alert("Teléfono y Dirección son obligatorios para domicilio.");
            return;
        }
        if (orderType === 'dine-in' && !tableNumber) {
            alert("Número de mesa obligatorio.");
            return;
        }

        setLoading(true);
        try {
            // Nota: El backend (Firebase) guardará todo, pero la UI de cocina (Fase 3) deberá filtrar la dirección.
            await placeOrder(customerName || 'Cliente General', orderType as any, user?.id || 'anon');
            alert(`Orden creada con éxito. Total: $${total.toFixed(2)}`);
            reset();
        } catch (error) {
            console.error(error);
            alert("Error al guardar la orden.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={reset} 
            title={step === 'type' ? "Tipo de Pedido" : "Detalles del Pedido"}
        >
            {step === 'type' ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                    <Button variant="outline" style={{ height: '60px', fontSize: '1.1rem' }} onClick={() => handleTypeSelect('dine-in')}>🍽️ Mesa (Dine-in)</Button>
                    <Button variant="outline" style={{ height: '60px', fontSize: '1.1rem' }} onClick={() => handleTypeSelect('takeaway')}>👜 Para Llevar (Takeaway)</Button>
                    <Button variant="outline" style={{ height: '60px', fontSize: '1.1rem' }} onClick={() => handleTypeSelect('delivery')}>🛵 Teléfono / Domicilio</Button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{display: 'block', fontSize: '0.9rem', marginBottom: '4px'}}>Nombre Cliente (Opcional)</label>
                        <input className="input-field" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                    </div>

                    {orderType === 'dine-in' && (
                         <div>
                            <label style={{display: 'block', fontSize: '0.9rem', marginBottom: '4px'}}>Número de Mesa *</label>
                            <input className="input-field" type="text" value={tableNumber} onChange={e => setTableNumber(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                        </div>
                    )}

                    {(orderType === 'delivery' || orderType === 'takeaway') && (
                        <div>
                            <label style={{display: 'block', fontSize: '0.9rem', marginBottom: '4px'}}>Teléfono {orderType === 'delivery' ? '*' : ''}</label>
                            <input className="input-field" type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                        </div>
                    )}

                    {orderType === 'delivery' && (
                        <div>
                            <label style={{display: 'block', fontSize: '0.9rem', marginBottom: '4px'}}>Dirección Exacta * (Solo Delivery)</label>
                            <textarea value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '8px', height: '60px' }} placeholder="Calle, número de casa, referencia..." />
                            <small style={{ color: 'gray' }}>Esta dirección no será visible en la pantalla de cocina.</small>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <Button variant="secondary" onClick={() => setStep('type')} disabled={loading}>Atrás</Button>
                        <Button variant="primary" style={{ flex: 1 }} onClick={handleConfirm} disabled={loading}>
                            {loading ? 'Guardando...' : `Confirmar ($${total.toFixed(2)})`}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};