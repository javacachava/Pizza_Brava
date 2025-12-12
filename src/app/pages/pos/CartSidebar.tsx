import React from 'react';
import type { OrderItem } from '../../../models/OrderItem';
import { CartItem } from './CartItem';
import { Button } from '../../components/ui/Button';
import { calculateCartTotal } from '../../../utils/pos';

interface Props {
  cart: OrderItem[];
  // Cambiamos string por number para manejar índices exactos
  onIncrease: (index: number) => void;
  onDecrease: (index: number) => void;
  onRemove: (index: number) => void;
  onSubmitOrder: () => void;
}

export const CartSidebar: React.FC<Props> = ({
  cart,
  onIncrease,
  onDecrease,
  onRemove,
  onSubmitOrder
}) => {
  const total = calculateCartTotal(cart);

  return (
    <div className="bg-white w-80 border-l fixed right-0 top-0 h-full flex flex-col shadow-xl z-20">
      <div className="flex-1 overflow-auto p-3">

        <h2 className="font-semibold text-xl mb-4 text-gray-800 border-b pb-2">Orden Actual</h2>

        {/* Usamos 'index' para identificar la línea exacta en el carrito */}
        {cart.map((item, index) => (
          <CartItem
            key={`${item.productId}-${index}`} // Key única combinada
            item={item}
            onIncrease={() => onIncrease(index)}
            onDecrease={() => onDecrease(index)}
            onRemove={() => onRemove(index)}
          />
        ))}

        {cart.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-4xl mb-2">🛒</span>
            <p className="text-sm">El carrito está vacío</p>
          </div>
        )}
      </div>

      <div className="border-t p-4 bg-gray-50">
        <div className="flex justify-between font-bold text-lg mb-3 text-gray-800">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <Button
          onClick={onSubmitOrder}
          disabled={cart.length === 0}
          className="w-full py-3 text-lg shadow-md hover:shadow-lg transition-all"
        >
          Cobrar / Enviar
        </Button>
      </div>
    </div>
  );
};