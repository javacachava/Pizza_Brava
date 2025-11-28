import { useState, useMemo } from 'react';

export function useComboLogic(comboConfig, globalInventory) {
  const [selections, setSelections] = useState({}); // Mapa slotId -> selectionData

  const handleSelectSlot = (slotId, data) => {
    setSelections(prev => ({ ...prev, [slotId]: data }));
  };

  const calculation = useMemo(() => {
    if (!comboConfig) return { total: 0, valid: false, extras: [] };

    let totalExtras = 0;
    let missingSlots = [];
    const breakdown = [];

    comboConfig.slots.forEach(slot => {
      const selection = selections[slot.id];
      
      if (!selection) {
        missingSlots.push(slot.label);
        return;
      }

      // 1. Lógica de Cambio de Complemento (Snapshot Pricing)
      if (slot.type === 'side' || slot.type === 'drink') {
        // selection.product contiene el precio actual del item seleccionado
        // slot.includedPrice es el precio base definido en el combo (SNAPSHOT)
        const currentPrice = selection.product.price || 0;
        const includedPrice = slot.includedPrice || 0;
        
        // Solo cobramos la diferencia positiva
        const diff = Math.max(0, currentPrice - includedPrice);
        
        if (diff > 0) {
          totalExtras += diff;
          breakdown.push({ name: `Upgrade: ${selection.product.name}`, price: diff });
        }
      }

      // 2. Lógica de Pizza Clásica (Ingredientes Extra)
      if (slot.type === 'pizza_classic') {
        const extraIngCost = selection.extraIngredientsCost || 0;
        if (extraIngCost > 0) {
          totalExtras += extraIngCost;
          breakdown.push({ name: `Extras Pizza: ${selection.details}`, price: extraIngCost });
        }
      }
    });

    return {
      basePrice: comboConfig.basePrice,
      totalExtras,
      finalPrice: comboConfig.basePrice + totalExtras,
      isValid: missingSlots.length === 0,
      breakdown,
      selections
    };
  }, [comboConfig, selections]);

  return { handleSelectSlot, calculation };
}