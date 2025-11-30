import React, { useEffect } from "react";
import ProductOptionsModal from "./ProductOptionsModal";

export default function ProductDispatcher({
  selectedProduct,
  onClose,
  onConfirm,
  globalConfig,
  ingredients, 
  sides,       
  drinks,      
  potatoes,    
  sauces       
}) {
  // Determinamos si es pizza antes del return
  const mainCategory = (selectedProduct?.mainCategory || "").toLowerCase();
  const isPizza =
    mainCategory === "pizzas" ||
    selectedProduct?.pizzaType === "Clasica" ||
    selectedProduct?.pizzaType === "Especialidad";

  // ============================================================
  // SOLUCIÓN: Usar useEffect para evitar la doble ejecución
  // ============================================================
  useEffect(() => {
    if (selectedProduct && !isPizza) {
      // Se agrega al carrito solo una vez cuando el componente se monta
      onConfirm({
        ...selectedProduct,
        qty: selectedProduct.qty ?? 1
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // El array vacío asegura que solo corra una vez al montar

  if (!selectedProduct) return null;

  // ============================================================
  // 1) PIZZAS → renderizar ProductOptionsModal
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
  // 2) RESTO DE PRODUCTOS → Retornamos null porque el useEffect 
  //    ya se encargó de agregarlo.
  // ============================================================
  return null;
}