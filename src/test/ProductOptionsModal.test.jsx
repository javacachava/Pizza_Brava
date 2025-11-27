import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductOptionsModal from '../components/ProductOptionsModal';

// Mock de Configuración Global
const mockGlobalConfig = {
  ingredients: ["Jamón", "Hongos", "Pepperoni"],
  sides: ["Pan con Ajo", "Nudos"],
  drinks: ["Coca Cola", "Fanta"],
  rules: {
    ingredientPrice: 1.00,
    sizes: {
      Personal: { label: "Personal", priceModifier: 0 },
      Grande: { label: "Gigante", priceModifier: 5.00 }
    }
  }
};

const mockProductPizza = {
  id: 'p1',
  name: 'Pizza Clásica',
  price: 5.00,
  pizzaType: 'Clasica',
  mainCategory: 'Pizzas',
  comboOptions: {}
};

describe('ProductOptionsModal Component', () => {
  
  it('no debe renderizarse si isOpen es false', () => {
    const { container } = render(
      <ProductOptionsModal 
        isOpen={false} 
        product={mockProductPizza} 
        // Aunque aquí no falle, es buena práctica pasarlos también
        ingredientsList={mockGlobalConfig.ingredients}
        prices={mockGlobalConfig.rules}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('debe calcular el precio base correctamente (Personal)', () => {
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        // --- AQUÍ FALTABAN ESTAS PROPS ---
        ingredientsList={mockGlobalConfig.ingredients}
        prices={mockGlobalConfig.rules}
        // ----------------------------------
        onClose={() => {}} 
        onConfirm={() => {}} 
      />
    );
    
    const priceElements = screen.getAllByText(/\$5.00/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('debe actualizar precio al cambiar a Gigante', () => {
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        // --- AQUÍ TAMBIÉN ---
        ingredientsList={mockGlobalConfig.ingredients}
        prices={mockGlobalConfig.rules}
        // --------------------
        onClose={() => {}} 
        onConfirm={() => {}} 
      />
    );

    const btnGigante = screen.getByRole('button', { name: /Gigante/i });
    fireEvent.click(btnGigante);

    expect(screen.getByText(/\$10.00/)).toBeInTheDocument();
  });

  it('debe cobrar extras solo después de los incluidos', () => {
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        // --- Y AQUÍ ---
        ingredientsList={mockGlobalConfig.ingredients}
        prices={mockGlobalConfig.rules}
        // --------------
        onClose={() => {}} 
        onConfirm={() => {}} 
      />
    );

    const ingJamon = screen.getByText('Jamón');
    fireEvent.click(ingJamon);
    expect(screen.getAllByText(/\$5.00/).length).toBeGreaterThan(0);

    const ingHongos = screen.getByText('Hongos');
    fireEvent.click(ingHongos);
    expect(screen.getAllByText(/\$5.00/).length).toBeGreaterThan(0);

    const ingPepperoni = screen.getByText('Pepperoni');
    fireEvent.click(ingPepperoni);
    
    expect(screen.getByText(/\$6.00/)).toBeInTheDocument();
  });

  it('debe validar mínimo de ingredientes al confirmar', () => {
    const mockOnConfirm = vi.fn();
    
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        // --- Y AQUÍ ---
        ingredientsList={mockGlobalConfig.ingredients}
        prices={mockGlobalConfig.rules}
        // --------------
        onClose={() => {}} 
        onConfirm={mockOnConfirm} 
      />
    );

    // Nota: El botón final suele tener el texto "Agregar" según tu componente
    const btnAgregar = screen.getByText(/Agregar/i); 
    
    fireEvent.click(btnAgregar);

    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });
});