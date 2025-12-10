import React, { useState } from 'react';
import { usePOS } from '../../../../hooks/usePOS';
import { CartItem } from './CartItem';
import { Button } from '../../../components/ui/Button';
import { OrderTypeModal } from './OrderTypeModal';

export const CartSidebar: React.FC = () => {
    const { cart, removeFromCart, clearCart, total } = usePOS();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    if (cart.length === 0) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>
                <p>El carrito está vacío</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                {cart.map((item, index) => (
                    <CartItem key={index} item={item} index={index} onRemove={removeFromCart} />
                ))}
            </div>
            
            <div style={{ marginTop: 'auto', borderTop: '2px solid #e2e8f0', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '10px', marginTop: '15px' }}>
                    <Button variant="outline" onClick={clearCart}>Limpiar</Button>
                    <Button variant="primary" onClick={() => setIsCheckoutOpen(true)}>COBRAR</Button>
                </div>
            </div>

            <OrderTypeModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
        </div>
    );
};