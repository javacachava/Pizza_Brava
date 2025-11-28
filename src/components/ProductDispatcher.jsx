import React from 'react';
import PizzaBuilderModal from './modals/PizzaBuilderModal';
import ComboBuilderModal from './modals/ComboBuilderModal';
import HamburgerModal from './modals/HamburgerModal';

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
  if (!selectedProduct) return null;

  // Lógica de selección de modal basada en la categoría o tipo
  // Asumimos que el producto tiene un campo 'type' o usamos 'mainCategory'
  
  const type = selectedProduct.type || (selectedProduct.mainCategory === 'Pizzas' ? 'pizza_classic' : 'simple');

  if (type === 'combo') {
    return (
      <ComboBuilderModal 
        comboProduct={selectedProduct} 
        sides={sides} 
        drinks={drinks} 
        onClose={onClose} 
        onConfirm={onConfirm} 
      />
    );
  }

  if (type === 'pizza_classic') {
    return (
      <PizzaBuilderModal 
        product={selectedProduct} 
        globalConfig={globalConfig}
        ingredients={ingredients}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  if (selectedProduct.mainCategory === 'Hamburguesas') {
      return (
          <HamburgerModal 
            product={selectedProduct}
            potatoes={potatoes}
            sauces={sauces}
            onClose={onClose}
            onConfirm={onConfirm}
          />
      )
  }

  // Si no requiere configuración compleja, agregar directo (o mostrar modal simple)
  // En este caso, lo manejamos en el componente padre si es simple, 
  // o renderizamos un modal genérico aquí.
  return null;
}