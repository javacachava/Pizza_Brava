// Estructura de Ejemplo para Firestore
const structure = {
  // 1. Catálogo de Ingredientes (Global)
  ingredients: [
    { id: "jamon", name: "Jamón", price: 0.75, stock: 500, type: "protein", active: true },
    { id: "pepperoni", name: "Pepperoni", price: 0.75, stock: 300, type: "protein", active: true },
    { id: "pimiento", name: "Pimiento", price: 0.50, stock: 100, type: "veggie", active: true }
  ],
  // 2. Complementos y Papas
  sides: [
    { id: "nudos_ajo", name: "Nudos de Ajo", price: 3.00, stock: 50, active: true },
    { id: "papas_fritas", name: "Papas Fritas", price: 2.50, stock: 100, types: ["curly", "waffle", "normal"], active: true }
  ],
  // 3. Reglas Globales
  config: {
    global_rules: {
      classic_pizza_included_ingredients: 2, // N ingredientes
      ingredient_extra_price: 0.75
    }
  },
  // 4. COMBOS (La parte compleja)
  combos: [
    {
      id: "combo_familiar",
      name: "Combo Familiar",
      basePrice: 19.99,
      active: true,
      slots: [
        {
          id: "slot_1",
          type: "pizza_classic",
          label: "Pizza Grande",
          size: "Grande",
          includedIngredients: 2,
          allowExtraIngredients: true
        },
        {
          id: "slot_2",
          type: "side",
          label: "Acompañamiento",
          // REGLA CRITICA: includedPrice es el snapshot para calcular extras
          // Si el cliente elige "Nudos" ($3.00) el extra es 0.
          // Si elige "Alitas" ($6.00) el extra es 6.00 - 3.00 = 3.00
          includedPrice: 3.00, 
          allowedOptions: ["nudos_ajo", "pan_ajo", "papas_fritas"] // IDs de sides permitidos
        },
        {
          id: "slot_3",
          type: "drink",
          label: "Bebida 1.5L",
          includedPrice: 2.00,
          qty: 1
        }
      ]
    }
  ]
};