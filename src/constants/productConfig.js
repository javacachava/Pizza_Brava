export const AVAILABLE_TOPPINGS = [
  "Jamón",
  "Pepperoni",
  "Salami",
  "Chorizo",
  "Pollo",
  "Carne Molida",
  "Champiñones",
  "Cebolla",
  "Pimientos",
  "Aceitunas",
  "Piña",
  "Maíz",
  "Jalapeños",
  "Extra Queso"
];

// Mapeo por NOMBRE EXACTO del producto en Firestore
export const PRODUCT_CONFIG = {
  "La Clásica (2 ingredientes)": {
    type: "pizza",
    maxFreeToppings: 2,
    extraToppingPrice: 1.00, // Ajustable
    toppings: AVAILABLE_TOPPINGS
  },
  "Personal (2 ingredientes)": {
    type: "pizza",
    maxFreeToppings: 2,
    extraToppingPrice: 0.50, // Ajustable
    toppings: AVAILABLE_TOPPINGS
  },
  // Puedes agregar más configuraciones aquí para otras pizzas si quieres que sean personalizables
  "Pizza de Birria": {
    type: "pizza",
    maxFreeToppings: 0, // Ya viene definida
    extraToppingPrice: 1.50,
    toppings: ["Extra Birria", "Extra Queso", "Cebolla y Cilantro"]
  }
};