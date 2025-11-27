import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// Asegúrate de que la ruta de importación sea correcta para tu estructura
import ProductOptionsModal from '../components/ProductOptionsModal';

// 1. Mocks de datos (Simulamos lo que vendría de Firebase)
const mockIngredients = ["Jamón", "Hongos", "Pepperoni"];
const mockPrices = { 
  extraIngredient: 1.00, 
  sizeDifference: 5.00 
};

// Mock de una Pizza Clásica
const mockProductPizza = {
  id: 'p1',
  name: 'Pizza Clásica',
  price: 5.00,
  pizzaType: 'Clasica', // Esto activa la lógica de tamaños
  mainCategory: 'Pizzas',
  comboOptions: {} // Objeto vacío por defecto
};

describe('ProductOptionsModal Component', () => {
  
  it('no debe renderizarse si isOpen es false', () => {
    const { container } = render(
      <ProductOptionsModal 
        isOpen={false} 
        product={mockProductPizza} 
        ingredientsList={mockIngredients}
        prices={mockPrices}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('debe calcular el precio base correctamente (Personal)', () => {
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        ingredientsList={mockIngredients}
        prices={mockPrices}
        onClose={() => {}} 
        onConfirm={() => {}} 
      />
    );
    
    // Precio base personal ($5.00) + 0 modificador = $5.00
    // Usamos una expresión regular para encontrar el texto flexiblemente
    expect(screen.getByText(/\$5.00/)).toBeInTheDocument();
  });

  it('debe actualizar precio al cambiar a Gigante', () => {
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        ingredientsList={mockIngredients}
        prices={mockPrices}
        onClose={() => {}} 
        onConfirm={() => {}} 
      />
    );

    // Buscar el botón que contiene el texto del precio extra o la etiqueta
    // En tu componente el botón dice: "Gigante (+ $4.00)" (según DB) 
    // o "Gigante" a secas + el precio en el botón.
    // Buscaremos por el rol de botón que tenga texto "Gigante"
    const btnGigante = screen.getByRole('button', { name: /Gigante/i });
    fireEvent.click(btnGigante);

    // 5.00 (Base) + 5.00 (Mock Diferencia) = 10.00
    expect(screen.getByText(/\$10.00/)).toBeInTheDocument();
  });

  it('debe cobrar extras solo después de los incluidos', () => {
    render(
      <ProductOptionsModal 
        isOpen={true} 
        product={mockProductPizza} 
        ingredientsList={mockIngredients}
        prices={mockPrices}
        onClose={() => {}} 
        onConfirm={() => {}} 
      />
    );

    // La Pizza Clásica incluye 2 ingredientes gratis.
    
    // 1. Seleccionamos Jamón (1/2) -> Precio sigue $5.00
    const ingJamon = screen.getByText('Jamón');
    fireEvent.click(ingJamon);
    expect(screen.getByText(/\$5.00/)).toBeInTheDocument();

    // 2. Seleccionamos Hongos (2/2) -> Precio sigue $5.00
    const ingHongos = screen.getByText('Hongos');
    fireEvent.click(ingHongos);
    expect(screen.getByText(/\$5.00/)).toBeInTheDocument();

    // 3. Seleccionamos Pepperoni (3/2) -> Extra! (+ $1.00) -> Total $6.00
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
        ingredientsList={mockIngredients}
        prices={mockPrices}
        onClose={() => {}} 
        onConfirm={mockOnConfirm} 
      />
    );

    // Intentar agregar sin seleccionar nada (Requiere 2)
    // Buscamos el botón que tenga el ícono ChevronRight o texto "Agregar"
    // La mejor práctica es buscar por rol button
    const buttons = screen.getAllByRole('button');
    // El botón de confirmar suele ser el último o tener un texto específico, 
    // asumiremos que el test busca el botón de acción principal.
    const btnAgregar = buttons[buttons.length - 1]; 
    
    fireEvent.click(btnAgregar);

    // Verificar que NO se llamó a onConfirm (se bloqueó) y se mostró alerta
    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });
});