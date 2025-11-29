// src/hooks/useComboLogic.js
import { useState, useMemo } from "react";

export function useComboLogic(comboConfig, globalInventory) {
  const [selections, setSelections] = useState({}); // slotId -> selection

  const handleSelectSlot = (slotId, selectionData) => {
    setSelections((prev) => ({
      ...prev,
      [slotId]: selectionData,
    }));
  };

  const calculation = useMemo(() => {
    if (!comboConfig) {
      return {
        basePrice: 0,
        totalExtras: 0,
        finalPrice: 0,
        total: 0,
        isValid: false,
        valid: false,
        breakdown: [],
        extras: [],
        selections,
        missingSlots: [],
      };
    }

    const slots = Array.isArray(comboConfig.slots) ? comboConfig.slots : [];
    let totalExtras = 0;
    const breakdown = [];
    const missingSlots = [];

    slots.forEach((slot) => {
      const slotId = slot.id || slot.label;
      const selection = selections[slotId];

      if (!selection) {
        // Slot sin selección => combo incompleto
        missingSlots.push(slotId);
        return;
      }

      const includedPrice = Number(slot.includedPrice) || 0;
      let extra = 0;
      let label = slot.label || "";

      // 1) Si el submodal ya calculó el extra explícito
      if (typeof selection.extraCost === "number") {
        extra = selection.extraCost;
      }
      // 2) Si hay un product con price (sides, drinks, etc.)
      else if (
        selection.product &&
        typeof selection.product.price === "number"
      ) {
        extra = Math.max(
          0,
          Number(selection.product.price) - includedPrice
        );
        label = selection.product.name || label;
      }
      // 3) Si solo tenemos un price plano en la selección
      else if (typeof selection.price === "number") {
        extra = Math.max(0, Number(selection.price) - includedPrice);
      }

      // Detalles (ingredientes, salsas, etc.)
      let detailsText = "";
      if (
        selection.details &&
        Array.isArray(selection.details) &&
        selection.details.length > 0
      ) {
        detailsText = selection.details
          .map((d) =>
            typeof d === "string" ? d : d.label || d.name || ""
          )
          .filter(Boolean)
          .join(", ");
      }

      totalExtras += extra;

      breakdown.push({
        slotId,
        slotLabel: slot.label,
        label,
        type: slot.type,
        includedPrice,
        extra,
        selection,
        detailsText,
      });
    });

    const basePrice =
      Number(comboConfig.basePrice) || Number(comboConfig.price) || 0;
    const finalPrice = basePrice + totalExtras;
    const isValid = missingSlots.length === 0;

    return {
      basePrice,
      totalExtras,
      finalPrice,
      total: finalPrice, // alias por compatibilidad
      isValid,
      valid: isValid, // alias
      breakdown,
      extras: breakdown, // alias
      selections,
      missingSlots,
    };
  }, [comboConfig, selections]);

  return { handleSelectSlot, calculation, selections };
}
