import React, { useState, useMemo, useEffect } from 'react';
import type { ComboDefinition } from '../../../models/ComboDefinition';
import type { MenuItem } from '../../../models/MenuItem';
import type { OrderItem } from '../../../models/OrderItem';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../../utils/format';
import { generateId } from '../../../utils/id';

interface Props {
  combo: ComboDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comboItem: OrderItem) => void;
  products: MenuItem[]; // Necesitamos el menú completo para mostrar opciones
}

interface SlotSelection {
  slotType: 'pizza' | 'drink' | 'side';
  label: string;
  selectedProductId: string | null;
  options: MenuItem[];
}

export const ComboSelectionModal: React.FC<Props> = ({
  combo,
  isOpen,
  onClose,
  onConfirm,
  products
}) => {
  const [slots, setSlots] = useState<SlotSelection[]>([]);

  // 1. Analizar reglas del combo y construir "Slots" (Huecos a llenar)
  useEffect(() => {
    if (!combo || !isOpen) return;

    const newSlots: SlotSelection[] = [];
    const rules = combo.rules || { maxPizzas: 0, maxDrinks: 0, maxSides: 0 };

    // Helper para filtrar productos por categoría
    // Ajusta los IDs de categoría según tu bootstrap.json real
    const pizzas = products.filter(p => p.categoryId.includes('pizza') && p.isAvailable);
    const drinks = products.filter(p => p.categoryId === 'bebidas' && p.isAvailable);
    const sides = products.filter(p => (p.categoryId === 'acompanamientos' || p.categoryId === 'entradas') && p.isAvailable);

    // Crear slots según cantidad permitida
    for (let i = 0; i < rules.maxPizzas; i++) {
      newSlots.push({ slotType: 'pizza', label: `Pizza #${i + 1}`, selectedProductId: null, options: pizzas });
    }
    for (let i = 0; i < rules.maxDrinks; i++) {
      newSlots.push({ slotType: 'drink', label: `Bebida #${i + 1}`, selectedProductId: null, options: drinks });
    }
    for (let i = 0; i < rules.maxSides; i++) {
      newSlots.push({ slotType: 'side', label: `Complemento #${i + 1}`, selectedProductId: null, options: sides });
    }

    // Preselección Inteligente (Opcional: seleccionar el primero por defecto)
    const initializedSlots = newSlots.map(s => ({
      ...s,
      selectedProductId: s.options.length > 0 ? s.options[0].id : null
    }));

    setSlots(initializedSlots);
  }, [combo, isOpen, products]);

  if (!combo) return null;

  const handleSelectionChange = (index: number, productId: string) => {
    const updated = [...slots];
    updated[index].selectedProductId = productId;
    setSlots(updated);
  };

  const handleConfirm = () => {
    // Validar que todo esté lleno
    if (slots.some(s => !s.selectedProductId)) {
      alert("Por favor selecciona todos los productos del combo.");
      return;
    }

    // Construir lista de items internos
    const internalItems = slots.map(s => {
      const prod = products.find(p => p.id === s.selectedProductId);
      return {
        productId: s.selectedProductId!,
        quantity: 1,
        name: prod?.name || 'Item',
        price: 0 // Asumimos precio incluido en el combo
      };
    });

    const orderItem: OrderItem = {
      productId: null,
      productName: combo.name,
      quantity: 1,
      unitPrice: combo.price,
      totalPrice: combo.price,
      isCombo: true,
      combo: {
        id: generateId(),
        comboDefinitionId: combo.id,
        name: combo.name,
        price: combo.price,
        items: internalItems
      },
      selectedOptions: []
    };

    onConfirm(orderItem);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Armar Combo: ${combo.name}`}
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} className="bg-orange-600 text-white font-bold hover:bg-orange-700">
            Agregar Combo {formatPrice(combo.price)}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 p-1 max-h-[60vh] overflow-y-auto">
        <p className="text-sm text-gray-500 italic border-l-2 border-orange-300 pl-2">
          {combo.description}
        </p>

        {slots.map((slot, idx) => (
          <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {slot.label}
            </label>
            
            {slot.options.length === 0 ? (
              <div className="text-red-500 text-xs">No hay opciones disponibles</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                <select 
                  className="w-full p-2 border rounded bg-white text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none"
                  value={slot.selectedProductId || ''}
                  onChange={(e) => handleSelectionChange(idx, e.target.value)}
                >
                  {slot.options.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
        
        {slots.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Este combo no requiere configuración.
          </div>
        )}
      </div>
    </Modal>
  );
};