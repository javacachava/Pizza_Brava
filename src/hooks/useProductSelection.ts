import { useState, useMemo, useEffect } from 'react';
import type { ProductUI, ComboOption, VariantOption } from '../models/ProductTypes';

export const useProductSelection = (product: ProductUI) => {
  const [comboSelections, setComboSelections] = useState<Record<string, ComboOption>>({});
  const [variantSelections, setVariantSelections] = useState<Record<string, VariantOption>>({});
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());

  // Initialization Logic
  useEffect(() => {
    // 1. Combo Defaults
    if (product.behavior === 'COMBO_PACK' && product.comboConfig?.slots) {
      const defaults: Record<string, ComboOption> = {};
      product.comboConfig.slots.forEach(slot => {
        const defaultOpt = slot.options.find(o => o.id === slot.defaultOptionId) || slot.options[0];
        if (defaultOpt) defaults[slot.id] = defaultOpt;
      });
      setComboSelections(defaults);
    }

    // 2. Variant Defaults
    if (product.behavior === 'SIMPLE_VARIANT' && product.variantConfig?.groups) {
      const defaults: Record<string, VariantOption> = {};
      product.variantConfig.groups.forEach(group => {
         // Auto-select first option if none selected
         if (group.options.length > 0) {
           defaults[group.id] = group.options[0];
         }
      });
      setVariantSelections(defaults);
    }
    
    // 3. Ingredient Defaults (Included ones)
    if (product.behavior === 'CUSTOM_BUILDER' && product.builderConfig?.ingredients) {
      const defaults = new Set<string>();
      product.builderConfig.ingredients.forEach(ing => {
        if (ing.isDefault) defaults.add(ing.id);
      });
      setSelectedIngredients(defaults);
    }

  }, [product.id]); // Reset on product change

  // Actions
  const selectComboOption = (slotId: string, option: ComboOption) => {
    setComboSelections(prev => ({ ...prev, [slotId]: option }));
  };

  const selectVariant = (groupId: string, option: VariantOption) => {
    setVariantSelections(prev => ({ ...prev, [groupId]: option }));
  };

  const toggleIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  };

  // Pricing Logic (Crucial Business Logic)
  const totalPrice = useMemo(() => {
    let price = product.price;

    // 1. Combo Logic: Base + (Selected - Default) if > 0
    if (product.behavior === 'COMBO_PACK' && product.comboConfig?.slots) {
       product.comboConfig.slots.forEach(slot => {
         const selected = comboSelections[slot.id];
         // Find default to compare
         const defaultOpt = slot.options.find(o => o.id === slot.defaultOptionId) || slot.options[0];
         
         if (selected && defaultOpt) {
            const diff = selected.price - defaultOpt.price;
            if (diff > 0) price += diff;
            // Note: If diff < 0 (cheaper option), we do NOT subtract price (as per rules)
         }
       });
    }

    // 2. Variant Logic: Base + PriceModifier
    if (product.behavior === 'SIMPLE_VARIANT') {
      Object.values(variantSelections).forEach(opt => {
        if (opt.priceModifier) price += opt.priceModifier;
      });
    }

    // 3. Builder Logic: Base + Extra Ingredients
    if (product.behavior === 'CUSTOM_BUILDER' && product.builderConfig?.ingredients) {
      product.builderConfig.ingredients.forEach(ing => {
        const isSelected = selectedIngredients.has(ing.id);
        // If it's selected AND NOT default (is extra) -> Charge
        if (isSelected && !ing.isDefault) {
           price += ing.price;
        }
        // NOTE: Does removing a default ingredient reduce price? Usually no in standard POS rules unless specified.
      });
    }

    return price;
  }, [product, comboSelections, variantSelections, selectedIngredients]);

  return {
    totalPrice,
    comboSelections,
    variantSelections,
    selectedIngredients,
    selectComboOption,
    selectVariant,
    toggleIngredient
  };
};