import { useState, useMemo, useEffect } from 'react';
import type { ComboDefinition } from '../models/ComboDefinition';

interface SelectedComboItem {
  id: string;
  price: number;
}

export const useComboSelection = (comboDefinition: ComboDefinition, availableOptions: Record<string, SelectedComboItem[]> = {}) => {
  // Estado para guardar la selección: { slotId: SelectedComboItem }
  const [selections, setSelections] = useState<Record<string, SelectedComboItem>>({});

  // 1. Inicializar con los defaults al abrir el modal
  useEffect(() => {
    const defaultSelections: Record<string, SelectedComboItem> = {};
    
    // Usamos 'slots' que es lo que existe en ComboDefinition (no comboGroups)
    comboDefinition.slots?.forEach(slot => {
        // Buscamos las opciones reales usando los IDs permitidos si están disponibles en availableOptions
        // O lógica placeholder si los datos vienen de otra forma
        const options = availableOptions[slot.id] || [];
        const defaultItem = options[0]; // Simplificación: toma el primero como default

        if (defaultItem) {
          defaultSelections[slot.id] = defaultItem;
        }
    });
    setSelections(defaultSelections);
  }, [comboDefinition, availableOptions]);

  // 2. Lógica de Precio Dinámico
  const totalPrice = useMemo(() => {
    let extraCost = 0;

    comboDefinition.slots?.forEach(slot => {
      const selectedItem = selections[slot.id];
      const options = availableOptions[slot.id] || [];
      const defaultItem = options[0];

      if (selectedItem && defaultItem && selectedItem.id !== defaultItem.id) {
        // Solo sumamos si es más caro
        const difference = Math.max(0, selectedItem.price - defaultItem.price); 
        extraCost += difference;
      }
    });

    return comboDefinition.price + extraCost;
  }, [comboDefinition, selections, availableOptions]);

  // 3. Función para cambiar opción
  const selectOption = (slotId: string, item: SelectedComboItem) => {
    setSelections(prev => ({
      ...prev,
      [slotId]: item
    }));
  };

  return {
    selections,
    totalPrice,
    selectOption
  };
};