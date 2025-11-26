export const PIZZA_INGREDIENTS = [
  "Jamón", "Pepperoni", "Salami", "Chorizo", "Pollo", "Tocino",
  "Chile verde", "Cebolla", "Maíz", "Aceitunas", "Hongos", "Piña", "Jalapeño"
];

export const PIZZA_RULES = {
  includedIngredients: 2, // 2 ingredientes obligatorios incluidos
  extraIngredientPrice: 0.75,
  sizes: {
    Personal: { label: "Personal", priceModifier: 0 }, // Precio base
    Grande: { label: "Gigante", priceModifier: 8.00 }   // Precio base + 8
  }
};

// Configuración de Subcategorías para los filtros del Menú
export const SUB_FILTERS = {
  Pizzas: ["Clásica", "Especialidad"], // Cambié a esto según tu lógica de "Clásica" vs otras
  Bebidas: ["Fría", "Caliente"],
  Hamburguesas: ["Individual", "Combo"]
};