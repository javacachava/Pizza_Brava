// src/scripts/seedDatabase.js
import {
  doc,
  setDoc,
  writeBatch,
  collection,
} from "firebase/firestore";
import { db } from "../services/firebase";

// ---- CONFIG GLOBAL (MATCH useConfig + FALLBACK_CONFIG) ----

const GLOBAL_CONFIG_DOC = {
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
    "Nuditos de Ajo",
    "Papas Fritas",
  ],
  drinks: [
    "Coca Cola 12oz",
    "Fanta Naranja 12oz",
    "Sprite 12oz",
    "Agua Embotellada",
  ],
  rules: {
    ingredientPrice: 0.75,
    ingredient_extra_price: 0.75,
    classic_pizza_included_ingredients: 2,
    sizes: {
      Personal: {
        label: "Personal",
        priceModifier: 0,
      },
      Grande: {
        label: "Gigante",
        priceModifier: 5.0,
      },
    },
    papas_extra_price: 1.5,
    salsa_extra_price: 0.75,
    combo_max_extra_ingredients: 3,
  },
  // Para AdminPanel (pestaña Config)
  prices: {
    extraIngredient: 0.75,
    sizeDifference: 5.0,
  },
};

// ---- DATA DE INVENTARIO ----

const INGREDIENTS = [
  { id: "jamon", name: "Jamón", price: 0.75 },
  { id: "pepperoni", name: "Pepperoni", price: 0.75 },
  { id: "hongos", name: "Hongos", price: 0.75 },
  { id: "pimiento", name: "Pimiento", price: 0.75 },
  { id: "cebolla", name: "Cebolla", price: 0.75 },
  { id: "aceitunas", name: "Aceitunas", price: 0.75 },
];

const SIDES = [
  { id: "garlic_bread", name: "Pan con Ajo", price: 3.0 },
  { id: "garlic_knots", name: "Nuditos de Ajo", price: 3.0 },
  { id: "garlic_pizzeta", name: "Pizzeta de Ajo", price: 4.0 },
  { id: "fries_regular", name: "Papas Fritas", price: 2.5 },
];

const DRINKS = [
  { id: "cola_12oz", name: "Coca Cola 12oz", price: 1.5 },
  { id: "fanta_12oz", name: "Fanta Naranja 12oz", price: 1.5 },
  { id: "sprite_12oz", name: "Sprite 12oz", price: 1.5 },
  { id: "water_500ml", name: "Agua Embotellada", price: 1.0 },
];

const POTATOES = [
  { id: "papas_curly", name: "Papas Curly", price: 2.5 },
  { id: "papas_caseras", name: "Papas Caseras", price: 2.75 },
];

const SAUCES = [
  { id: "salsa_bbq", name: "Salsa BBQ", price: 0.75 },
  { id: "salsa_ajo", name: "Salsa de Ajo", price: 0.75 },
  { id: "salsa_picante", name: "Salsa Picante", price: 0.75 },
];

// ---- MENU ITEMS (LO QUE VE RECEPCIÓN) ----
// Pizzas clásicas (usadas por PizzaBuilderModal)
const MENU_PIZZAS = [
  {
    id: "pizza_clasica_personal",
    name: "Pizza Clásica Personal",
    mainCategory: "Pizzas",
    station: "cocina",
    type: "pizza_classic",
    isClassic: true,
    basePrice: 5.0,
    price: 5.0,
    sizesAvailable: ["Personal", "Grande"],
    isActive: true,
  },
  {
    id: "pizza_clasica_grande",
    name: "Pizza Clásica Gigante",
    mainCategory: "Pizzas",
    station: "cocina",
    type: "pizza_classic",
    isClassic: true,
    basePrice: 10.0,
    price: 10.0,
    sizesAvailable: ["Personal", "Grande"],
    isActive: true,
  },
];

// Pizza especialidad de ejemplo
const MENU_PIZZAS_SPECIAL = [
  {
    id: "pizza_especial_mexicana_personal",
    name: "Pizza Mexicana Personal",
    mainCategory: "Pizzas",
    station: "cocina",
    type: "pizza_special",
    basePrice: 7.0,
    price: 7.0,
    flavor: "Mexicana",
    size: "Personal",
    isActive: true,
  },
];

// Hamburguesa de ejemplo (usada por HamburgerModal)
const MENU_BURGERS = [
  {
    id: "burger_clasica",
    name: "Hamburguesa Clásica",
    mainCategory: "Hamburguesas",
    station: "cocina",
    type: "hamburguesa",
    basePrice: 6.0,
    price: 6.0,
    includesFries: true,
    includesSauce: true,
    isActive: true,
  },
];

// Complementos simples
const MENU_SIDES = [
  {
    id: "side_garlic_bread",
    name: "Pan con Ajo",
    mainCategory: "Complementos",
    station: "cocina",
    type: "side",
    price: 3.0,
    isActive: true,
  },
  {
    id: "side_garlic_knots",
    name: "Nuditos de Ajo",
    mainCategory: "Complementos",
    station: "cocina",
    type: "side",
    price: 3.0,
    isActive: true,
  },
];

// Bebidas simples (venta directa)
const MENU_DRINKS = [
  {
    id: "drink_cola_12oz",
    name: "Coca Cola 12oz",
    mainCategory: "Bebidas",
    station: "barra",
    type: "drink_simple",
    price: 1.5,
    isActive: true,
  },
  {
    id: "drink_fanta_12oz",
    name: "Fanta Naranja 12oz",
    mainCategory: "Bebidas",
    station: "barra",
    type: "drink_simple",
    price: 1.5,
    isActive: true,
  },
];

// Combo de ejemplo (usado por AdminCombos + ComboBuilderModal)
const MENU_COMBOS = [
  {
    id: "combo_familiar_pizza_bebidas",
    name: "Combo Familiar Pizza + Bebidas",
    description:
      "1 Pizza Gigante Clásica + 4 bebidas 12oz. Permite cambiar acompañamiento con costo extra.",
    mainCategory: "Combos",
    station: "cocina",
    type: "combo",
    isCombo: true,
    isActive: true,
    basePrice: 18.0,
    price: 18.0,
    slots: [
      {
        id: "slot_pizza",
        label: "Pizza Gigante Clásica",
        type: "pizza_classic",
        includedPrice: 10.0,
        allowedOptions: [], // cualquier pizza clásica
      },
      {
        id: "slot_side",
        label: "Complemento incluido",
        type: "side",
        includedPrice: 3.0, // Pan con ajo (3.00) por defecto
        // permite cambiar a pizzeta de ajo (4.00) y se cobrará la diferencia
        allowedOptions: ["garlic_bread", "garlic_knots", "garlic_pizzeta"],
      },
      {
        id: "slot_drinks",
        label: "Bebidas (x4)",
        type: "drink",
        includedPrice: 1.5, // precio base por bebida
        allowedOptions: ["cola_12oz", "fanta_12oz", "sprite_12oz"],
      },
    ],
  },
];

// ---- FUNCIÓN PRINCIPAL ----

export async function seedDatabase() {
  const batch = writeBatch(db);

  // 1) Configuración global
  const configRef = doc(db, "configuration", "global_options");
  batch.set(configRef, GLOBAL_CONFIG_DOC);

  // 2) Ingredientes
  INGREDIENTS.forEach((ing) => {
    const ref = doc(collection(db, "ingredients"), ing.id);
    batch.set(ref, {
      name: ing.name,
      price: ing.price,
      stock: 100,
      minStock: 10,
      isActive: true,
    });
  });

  // 3) Complementos (sides)
  SIDES.forEach((side) => {
    const ref = doc(collection(db, "sides"), side.id);
    batch.set(ref, {
      name: side.name,
      price: side.price,
      stock: 50,
      minStock: 5,
      isActive: true,
    });
  });

  // 4) Bebidas
  DRINKS.forEach((drink) => {
    const ref = doc(collection(db, "drinks"), drink.id);
    batch.set(ref, {
      name: drink.name,
      price: drink.price,
      stock: 80,
      minStock: 10,
      isActive: true,
    });
  });

  // 5) Papas
  POTATOES.forEach((pot) => {
    const ref = doc(collection(db, "potatoes"), pot.id);
    batch.set(ref, {
      name: pot.name,
      price: pot.price,
      stock: 40,
      minStock: 5,
      isActive: true,
    });
  });

  // 6) Salsas
  SAUCES.forEach((sauce) => {
    const ref = doc(collection(db, "sauces"), sauce.id);
    batch.set(ref, {
      name: sauce.name,
      price: sauce.price,
      stock: 60,
      minStock: 10,
      isActive: true,
    });
  });

  // 7) MenuItems (pizzas, sides, bebidas, hamburguesas, combos)
  const allMenuItems = [
    ...MENU_PIZZAS,
    ...MENU_PIZZAS_SPECIAL,
    ...MENU_BURGERS,
    ...MENU_SIDES,
    ...MENU_DRINKS,
    ...MENU_COMBOS,
  ];

  allMenuItems.forEach((item) => {
    const ref = doc(collection(db, "menuItems"), item.id);
    batch.set(ref, item);
  });

  await batch.commit();
  console.log("✅ Seed completado: configuración, inventario y menú base creados.");
}
