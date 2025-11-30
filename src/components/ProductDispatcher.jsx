import React from "react";
import ProductOptionsModal from "./ProductOptionsModal";

export default function ProductDispatcher({
  selectedProduct,
  onClose,
  onConfirm,
  globalConfig,
  // Props extras que se pasan pero que el modal interno ya manejará si es necesario
  ingredients, 
  sides,       
  drinks,      
  potatoes,    
  sauces       
}) {
  // Si por alguna razón no hay producto, no renderizamos nada
  if (!selectedProduct) return null;

  // Como ReceptionPanel ya filtró los productos simples,
  // aquí asumimos que si llegamos a este punto, es porque necesitamos un Modal.
  // (Aun así, mantenemos la verificación de categoría por seguridad o futuros modales).

  const mainCategory = (selectedProduct.mainCategory || "").toLowerCase();
  
  // Lógica para determinar qué modal abrir
  const isPizza =
    mainCategory === "pizzas" ||
    selectedProduct.pizzaType === "Clasica" ||
    selectedProduct.pizzaType === "Especialidad";

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

  // Si en el futuro agregas Modales para Combos o Hamburguesas, ponlos aquí (else if...)

  // Si llegó aquí algo que no tiene modal configurado (por error), retornamos null 
  // para que no se rompa la UI, pero ya no hacemos onConfirm automático.
  return null;
}