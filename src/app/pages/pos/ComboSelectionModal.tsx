import React, { useState, useEffect } from 'react';
import type { Combo } from '../../../models/Combo';
import type { OrderItem } from '../../../models/OrderItem';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../../utils/format';

interface Props {
  combo: Combo | null;
  isOpen: boolean;
  onClose: () => void;
  // El modal debe devolver un OrderItem completo
  onConfirm: (comboItem: OrderItem) => void;
}

export const ComboSelectionModal: React.FC<Props> = ({
  combo,
  isOpen,
  onClose,
  onConfirm
}) => {
  // Aquí iría la lógica compleja de selección de slots.
  // Por simplicidad y para corregir el error, implementamos la versión básica
  // que asume un combo predefinido o sin opciones por ahora.
  
  if (!combo) return null;

  const handleConfirm = () => {
    // Construimos el OrderItem aquí (Domain Logic en UI boundary)
    const orderItem: OrderItem = {
      productId: null, // Es un combo, no un producto simple
      productName: combo.name,
      quantity: 1,
      unitPrice: combo.price,
      totalPrice: combo.price,
      isCombo: true,
      combo: combo, // Guardamos la ref
      selectedOptions: [] // Aquí irían las selecciones de slots convertidas a opciones
    };

    onConfirm(orderItem);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Combo: ${combo.name}`}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} className="bg-orange-600 text-white">
            Confirmar {formatPrice(combo.price)}
          </Button>
        </div>
      }
    >
      <div className="p-2 space-y-4">
        <p className="text-gray-600">{combo.description}</p>
        
        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
          ℹ️ Configuración de combo simplificada. Haga clic en confirmar para agregar.
        </div>
        
        {/* Aquí renderizarías los selectores si 'combo' tuviera slots definidos en el frontend */}
      </div>
    </Modal>
  );
};