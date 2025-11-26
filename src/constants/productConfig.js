export const PIZZA_INGREDIENTS = [
  "Jamón", "Pepperoni", "Salami", "Chorizo", "Pollo", "Tocino",
  "Chile verde", "Cebolla", "Maíz", "Aceitunas", "Hongos", "Piña", "Jalapeño"
];

export const PIZZA_RULES = {
  includedIngredients: 2, // Solo aplica a Clásicas
  extraIngredientPrice: 0.75,
  sizes: {
    Personal: { label: "Personal", priceModifier: 0 }, // Precio base del producto
    Grande: { label: "Gigante", priceModifier: 8.00 }   // Suma $8.00 al base
  }
};