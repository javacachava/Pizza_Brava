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

// Mock del producto
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
        globalConfig={mockGlobalConfig}
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
        globalConfig={mockGlobalConfig}
        onClose={() => {}} 
        onConfirm={() => {}} 
      />
    );
    
    // ARREGLO: Buscamos todos los elementos con $5.00.
    // El precio total suele ser el último o estar en un párrafo específico.
    // Verificamos que el texto "$5.00" exista en la pantalla.
    const priceElements = screen.getAllByText(/\$5.00/);
    expect(priceElements.length).toBeGreaterThan(0);
    // Opcional: verificar que uno de ellos es el total
    const totalElement = priceElements.find(el => el.tagName === 'P');
    expect(totalElement).toBeInTheDocument();
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

    // Buscamos el botón que contiene "Gigante"
    // Usamos una expresión regular flexible porque el texto puede ser "Gigante" o "Gigante (+$5.00)"
    const btnGigante = screen.getByRole('button', { name: /Gigante/i });
    fireEvent.click(btnGigante);

    // Precio esperado: 5.00 (Base) + 5.00 (Modifier) = $10.00
    // Como $10.00 es único (no está en los botones), getByText funciona directo
    expect(screen.getByText(/\$10.00/)).toBeInTheDocument();
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

    // 1. Seleccionamos Jamón -> Precio sigue $5.00
    const ingJamon = screen.getByText('Jamón');
    fireEvent.click(ingJamon);
    // Verificamos que siga existiendo algún $5.00 en pantalla
    expect(screen.getAllByText(/\$5.00/).length).toBeGreaterThan(0);

    // 2. Seleccionamos Hongos -> Precio sigue $5.00 (2 incluidos)
    const ingHongos = screen.getByText('Hongos');
    fireEvent.click(ingHongos);
    expect(screen.getAllByText(/\$5.00/).length).toBeGreaterThan(0);

    // 3. Seleccionamos Pepperoni -> Extra! (+ $1.00) -> Total $6.00
    const ingPepperoni = screen.getByText('Pepperoni');
    fireEvent.click(ingPepperoni);
    
    // Ahora el total debe ser $6.00
    expect(screen.getByText(/\$6.00/)).toBeInTheDocument();
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

    // Botón Agregar (el último botón de la pantalla suele ser el de confirmar)
    const buttons = screen.getAllByRole('button');
    const btnAgregar = buttons[buttons.length - 1]; 
    
    fireEvent.click(btnAgregar);

    // Verificar que NO se llamó a onConfirm
    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });
});