export const FALLBACK_CONFIG = {
  ingredients: [], 
  sides: [],       
  drinks: [],     
  rules: {
    ingredientPrice: 0,
    sizes: {
      Personal: { label: "Personal", priceModifier: 0 },
      Grande: { label: "Gigante", priceModifier: 0 }
    }
  }
};

export const INGREDIENTS_LIST = FALLBACK_CONFIG.ingredients;
export const SIDES_LIST = FALLBACK_CONFIG.sides;
export const DRINKS_LIST = FALLBACK_CONFIG.drinks;
export const CONFIG_RULES = FALLBACK_CONFIG.rules;