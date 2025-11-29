import React from "react";
import ProductOptionsModal from "./ProductOptionsModal";

export default function ProductDispatcher({
  selectedProduct,
  onClose,
  onConfirm,
  globalConfig,
  ingredients, // por ahora no usado, pero lo dejamos por compatibilidad
  sides,       // idem
  drinks,      // idem
  potatoes,    // idem
  sauces       // idem
}) {
  if (!selectedProduct) return null;

  const mainCategory = (selectedProduct.mainCategory || "").toLowerCase();

  const isPizza =
    mainCategory === "pizzas" ||
    selectedProduct.pizzaType === "Clasica" ||
    selectedProduct.pizzaType === "Especialidad";

  // ============================================================
  // 1) PIZZAS → usar ProductOptionsModal (tamaños + ingredientes)
  // ============================================================
  if (isPizza) {
    return (
      <ProductOptionsModal
        isOpen={true}
        product={selectedProduct}
        globalConfig={globalConfig}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  // ============================================================
  // 2) RESTO DE PRODUCTOS → se agregan directo al carrito
  //    (agua, birrias, hamburguesas simples, combos simples, etc.)
  // ============================================================
  onConfirm({
    ...selectedProduct,
    qty: selectedProduct.qty ?? 1
  });

  // No renderizamos modal en este caso
  return null;
}
