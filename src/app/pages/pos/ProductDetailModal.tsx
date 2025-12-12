import React, { useState, useEffect } from 'react';
import type { MenuItem } from '../../../models/MenuItem';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../../utils/format';

interface Props {
  product: MenuItem | null;
  isOpen: boolean; // <--- Agregado para cumplir con POSPage
  onClose: () => void;
  onConfirm: (product: MenuItem, quantity: number, notes?: string) => void; // <--- Firma coincidente con POSPage
}

export const ProductDetailModal: React.FC<Props> = ({
  product,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQty(1);
      setNotes('');
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleConfirm = () => {
    // Aquí podrías clonar el producto si modificas precio o agregas opciones
    onConfirm(product, qty, notes);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} className="bg-orange-600 text-white hover:bg-orange-700">
            Agregar {formatPrice(product.price * qty)}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-2">
        <p className="text-gray-600 text-sm italic">
          {product.description || "Sin descripción disponible"}
        </p>

        {/* Cantidad */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
          <span className="font-semibold text-gray-700">Cantidad</span>
          <div className="flex items-center gap-3">
            <button 
              className="w-10 h-10 rounded-full bg-white border shadow-sm hover:bg-gray-100 font-bold text-xl"
              onClick={() => setQty(q => Math.max(1, q - 1))}
            >
              -
            </button>
            <span className="text-xl font-bold w-8 text-center">{qty}</span>
            <button 
              className="w-10 h-10 rounded-full bg-white border shadow-sm hover:bg-gray-100 font-bold text-xl"
              onClick={() => setQty(q => q + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Notas Opcionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas de cocina</label>
          <textarea
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            rows={2}
            placeholder="Ej: Sin cebolla, aderezo aparte..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};