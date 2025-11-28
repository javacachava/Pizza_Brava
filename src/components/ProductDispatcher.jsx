import React from "react";

// MODALES PRINCIPALES
import PizzaClassicModal from "./modals/PizzaClassicModal";
import PizzaSpecialModal from "./modals/PizzaSpecialModal";
import ComboBuilderModal from "./modals/ComboBuilderModal";
import BeverageFlavorModal from "./modals/BeverageFlavorModal";
import HamburgerOptionsModal from "./modals/HamburgerOptionsModal";
import ExtrasSelector from "./modals/ExtrasSelector";

export default function ProductDispatcher({
  selectedProduct,
  onClose,
  onConfirm,
  ingredients,
  sides,
  drinks,
  potatoes,
  sauces,
  globalConfig
}) {
  if (!selectedProduct) return null;

  const category = selectedProduct.mainCategory?.toLowerCase();
  const flags = selectedProduct;

  // ============================================================
  // 🟠 1. COMBOS (reglas avanzadas)
  // ============================================================
  if (flags.isCombo === true || category === "combos") {
    return (
      <ComboBuilderModal
        combo={selectedProduct}
        ingredients={ingredients}
        sides={sides}
        drinks={drinks}
        potatoes={potatoes}
        sauces={sauces}
        globalRules={globalConfig}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  // ============================================================
  // 🟣 2. PIZZA CLÁSICA
  // ============================================================
  if (flags.isClassic === true || category === "pizzas") {
    return (
      <PizzaClassicModal
        product={selectedProduct}
        ingredients={ingredients}
        globalConfig={globalConfig}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  // ============================================================
  // 🟡 3. PIZZA ESPECIALIDAD
  // ============================================================
  if (flags.isSpecialty === true) {
    return (
      <PizzaSpecialModal
        product={selectedProduct}
        onClose={onClose}
        onConfirm={onConfirm}
        globalConfig={globalConfig}
      />
    );
  }

  // ============================================================
  // 🟢 4. BEBIDAS CON SABOR
  // ============================================================
  if (flags.requiresFlavor === true || category === "bebidas") {
    return (
      <BeverageFlavorModal
        product={selectedProduct}
        drinks={drinks}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  // ============================================================
  // 🔵 5. HAMBURGUESAS (papas + salsas)
  // ============================================================
  if (category === "hamburguesas") {
    return (
      <HamburgerOptionsModal
        product={selectedProduct}
        potatoes={potatoes}
        sauces={sauces}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  // ============================================================
  // 🟤 6. COMPLEMENTOS / SIDES
  // ============================================================
  if (category === "complementos" || category === "sides") {
    return (
      <ExtrasSelector
        product={selectedProduct}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  // ============================================================
  // ⚪ 7. PRODUCTO SIMPLE → agregar directo sin modal
  // ============================================================
  return onConfirm({
    name: selectedProduct.name,
    qty: 1,
    price: selectedProduct.price,
    productId: selectedProduct.id,
    mainCategory: selectedProduct.mainCategory,
    options: {}
  });
}
