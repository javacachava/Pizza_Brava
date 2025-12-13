import { useState, useMemo, useEffect } from 'react';
import type { ProductUI, ComboOption, VariantOption } from '../models/ProductTypes';

export const useProductSelection = (product: ProductUI) => {
  const [comboSelections, setComboSelections] = useState<Record<string, ComboOption>>({});
  const [variantSelections, setVariantSelections] = useState<Record<string, VariantOption>>({});
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Resetear estados al cambiar de producto
    setComboSelections({});
    setVariantSelections({});
    setSelectedIngredients(new Set());

    // 1. Inicializar Combos
    if (product.behavior === 'COMBO_PACK' && product.comboConfig) {
      const initial: Record<string, ComboOption> = {};
      product.comboConfig.slots.forEach((slot) => {
        const defaultOpt = slot.options.find((o) => o.id === slot.defaultOptionId) || slot.options[0];
        if (defaultOpt) initial[slot.id] = defaultOpt;
      });
      setComboSelections(initial);
    }

    // 2. Inicializar Ingredientes
    if (product.behavior === 'CUSTOM_BUILDER' && product.builderConfig) {
      const defaultIds = product.builderConfig.ingredients
        .filter((i) => i.isDefault)
        .map((i) => i.id);
      setSelectedIngredients(new Set(defaultIds));
    }
    
    // 3. Inicializar Variantes (Frozens)
    if (product.behavior === 'SIMPLE_VARIANT' && product.variantConfig) {
        const initialVars: Record<string, VariantOption> = {};
        product.variantConfig.groups.forEach((group) => {
            if (group.options.length > 0) {
                initialVars[group.id] = group.options[0];
            }
        });
        setVariantSelections(initialVars);
    }
  }, [product]);

  const totalPrice = useMemo(() => {
    let total = product.price;

    // Lógica Combo
    if (product.behavior === 'COMBO_PACK' && product.comboConfig) {
      product.comboConfig.slots.forEach((slot) => {
        const selected = comboSelections[slot.id];
        const defaultOpt = slot.options.find((o) => o.id === slot.defaultOptionId) || slot.options[0];
        if (selected && defaultOpt) {
          const diff = Math.max(0, selected.price - defaultOpt.price);
          total += diff;
        }
      });
    }

    // Lógica Builder (Pizzas)
    if (product.behavior === 'CUSTOM_BUILDER' && product.builderConfig) {
      product.builderConfig.ingredients.forEach((ing) => {
        const isSelected = selectedIngredients.has(ing.id);
        if (!ing.isDefault && isSelected) total += ing.price;
      });
    }

    // Lógica Variantes
    if (product.behavior === 'SIMPLE_VARIANT') {
        Object.values(variantSelections).forEach((opt) => {
            if (opt.priceModifier) total += opt.priceModifier;
        });
    }

    return total;
  }, [product, comboSelections, selectedIngredients, variantSelections]);

  const selectComboOption = (slotId: string, option: ComboOption) => {
    setComboSelections((prev) => ({ ...prev, [slotId]: option }));
  };

  const toggleIngredient = (ingredientId: string) => {
    setSelectedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) newSet.delete(ingredientId);
      else newSet.add(ingredientId);
      return newSet;
    });
  };

  const selectVariant = (groupId: string, option: VariantOption) => {
      setVariantSelections((prev) => ({ ...prev, [groupId]: option }));
  };

  return {
    comboSelections,
    selectedIngredients,
    variantSelections,
    totalPrice,
    selectComboOption,
    toggleIngredient,
    selectVariant
  };
};