export const FALLBACK_CONFIG = {
  ingredients: ["Jamón", "Pepperoni", "Hongos", "Pimiento", "Cebolla", "Aceitunas"],
  sides: ["Pan con Ajo", "Nudos", "Papas"],
  drinks: ["Coca Cola", "Fanta", "Agua", "Cerveza"],
  rules: {
    ingredientPrice: 0.75,
    sizes: {
      Personal: { label: "Personal", priceModifier: 0 },
      Grande: { label: "Gigante", priceModifier: 5.00 }
    }
  }
};

// Exportamos las listas individuales para mantener compatibilidad
// con componentes antiguos que las busquen directamente
export const INGREDIENTS_LIST = FALLBACK_CONFIG.ingredients;
export const SIDES_LIST = FALLBACK_CONFIG.sides;
export const DRINKS_LIST = FALLBACK_CONFIG.drinks;
export const CONFIG_RULES = FALLBACK_CONFIG.rules;