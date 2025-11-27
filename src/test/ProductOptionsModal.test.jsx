import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// CORRECCIÓN AQUÍ: Ruta correcta a la carpeta components
import ProductOptionsModal from '../components/ProductOptionsModal';

// Mock de Configuración Global (Lo que viene de Firebase)
const mockGlobalConfig = {
  ingredients: ["Jamón", "Hongos", "Pepperoni"],
  sides: ["Pan con Ajo", "Nudos"],
  drinks: ["Coca Cola", "Fanta"],
  rules: {
    ingredientPrice: 1.00, // Precio fácil para calcular
    sizes: {
      Personal: { label: "Personal", priceModifier: 0 },
      Grande: { label: "Gigante", priceModifier: 5.00 }
    }
  }
};

// Mock del producto Pizza Clásica
const mockProductPizza = {
  id: 'p1',
  name: 'Pizza Clásica',
  price: 5.00,
  pizzaType: 'Clasica', // Activa lógica de tamaño
  mainCategory: 'Pizzas',
  config: {
    allowSize: true,
    allowIngredients: true,
    includedIngredients: 2
  }
};

describe('ProductOptionsModal Component', () => {
  
  it('no debe renderizarse si isOpen es false', () => {
    const { container } = render(
      <ProductOptionsModal isOpen={false} product={mockProductPizza} globalConfig={mockGlobalConfig} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('debe calcular el precio base correctamente (Personal)', () => {
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        globalConfig={mockGlobalConfig} 
        onClose={() => {}} 
        onConfirm={() => {}} 
      />
    );
    
    // Precio base $5.00 (Personal no suma nada)
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  it('debe actualizar precio al cambiar a Gigante', () => {
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        globalConfig={mockGlobalConfig} 
        onClose={() => {}} 
        onConfirm={() => {}} 
      />
    );

    // Click en Gigante (+ $5.00)
    // Nota: Buscamos por el texto que definimos en el mock "Gigante"
    const btnGigante = screen.getByText(/Gigante/i);
    fireEvent.click(btnGigante);

    // 5.00 (Base) + 5.00 (Modifier) = 10.00
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('debe cobrar extras solo después de los incluidos', () => {
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        globalConfig={mockGlobalConfig} 
        onClose={() => {}} 
        onConfirm={() => {}} 
      />
    );

    // Pizza clásica incluye 2 ingredientes.
    // Seleccionamos 1 (Jamón) -> Precio sigue igual ($5.00)
    const ingJamon = screen.getByText('Jamón');
    fireEvent.click(ingJamon);
    expect(screen.getByText('$5.00')).toBeInTheDocument();

    // Seleccionamos 2 (Hongos) -> Precio sigue igual ($5.00)
    const ingHongos = screen.getByText('Hongos');
    fireEvent.click(ingHongos);
    expect(screen.getByText('$5.00')).toBeInTheDocument();

    // Seleccionamos 3 (Pepperoni) -> Extra (+ $1.00) -> Total $6.00
    const ingPepperoni = screen.getByText('Pepperoni');
    fireEvent.click(ingPepperoni);
    expect(screen.getByText('$6.00')).toBeInTheDocument();
  });

  it('debe validar mínimo de ingredientes al confirmar', () => {
    const mockOnConfirm = vi.fn();
    
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        globalConfig={mockGlobalConfig} 
        onClose={() => {}} 
        onConfirm={mockOnConfirm} 
      />
    );

    // Intentar agregar sin ingredientes (Requiere 2 según el mock)
    const btnAgregar = screen.getByText(/Agregar/i);
    fireEvent.click(btnAgregar);

    // Verificar que NO se llamó a onConfirm y se mostró alerta
    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('elegir al menos 2'));
  });
});