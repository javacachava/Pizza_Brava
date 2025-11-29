// src/constants/productConfig.js

// Configuración de respaldo (se usa solo si falla Firestore)
// Mantén esto simple pero coherente con lo que usan los componentes.
export const FALLBACK_CONFIG = {
  // Listas básicas usadas en AdminPanel (listas simples de texto)
  ingredients: [
    "Jamón",
    "Pepperoni",
    "Hongos",
    "Pimiento",
    "Cebolla",
    "Aceitunas",
  ],
  sides: [
    "Pan con Ajo",
    "Nudos de Ajo",
    "Papas Fritas",
  ],
  drinks: [
    "Coca Cola",
    "Fanta Naranja",
    "Sprite",
    "Agua",
  ],

  // Reglas globales
  rules: {
    // PRECIO POR INGREDIENTE EXTRA (nombre viejo y nuevo para compatibilidad)
    ingredientPrice: 0.75,              // usado por AdminPanel viejo
    ingredient_extra_price: 0.75,       // usado por modales nuevos

    // Nº de ingredientes incluidos en pizzas clásicas
    classic_pizza_included_ingredients: 2,

    // Diferencias de precio por tamaño
    sizes: {
      Personal: {
        label: "Personal",
        priceModifier: 0,               // base
      },
      Grande: {
        label: "Gigante",
        priceModifier: 5.0,             // se suma al precio base
      },
    },

    // Extras pensados para combos / hamburguesas (por si los usas)
    papas_extra_price: 1.5,
    salsa_extra_price: 0.75,
    combo_max_extra_ingredients: 3,
  },
};

// Exportamos las listas individuales para mantener compatibilidad
// con componentes antiguos que las buscan directo.
export const INGREDIENTS_LIST = FALLBACK_CONFIG.ingredients;
export const SIDES_LIST = FALLBACK_CONFIG.sides;
export const DRINKS_LIST = FALLBACK_CONFIG.drinks;
export const CONFIG_RULES = FALLBACK_CONFIG.rules;
