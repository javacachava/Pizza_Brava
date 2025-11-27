import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCart } from '../useCart';

describe('useCart Hook - Lógica de Negocio', () => {
  
  // Mock de un producto simple (Soda)
  const soda = { id: '1', name: 'Coca Cola', price: 1.50, isConfigured: false };
  
  // Mock de un producto complejo (Pizza Armada)
  const pizzaPersonal = { 
    id: '100', 
    name: 'Pizza Clásica (Personal)', 
    price: 5.00, 
    isConfigured: true,
    cartItemId: 'unique-id-123' // Simulamos el ID único que genera el modal
  };

  it('debe iniciar con el carrito vacío', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.cart).toEqual([]);
    expect(result.current.cartTotal).toBe(0);
  });

  it('debe agregar un producto simple correctamente', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart(soda);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].qty).toBe(1);
    expect(result.current.cartTotal).toBe(1.50);
  });

  it('debe sumar cantidad si se agrega el mismo producto simple', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart(soda);
      result.current.addToCart(soda); // Segunda vez
    });

    expect(result.current.cart).toHaveLength(1); // No debe crear otro item
    expect(result.current.cart[0].qty).toBe(2);
    expect(result.current.cartTotal).toBe(3.00);
  });

  it('debe tratar pizzas configuradas como items distintos si tienen IDs diferentes', () => {
    const { result } = renderHook(() => useCart());

    const pizzaA = { ...pizzaPersonal, cartItemId: 'id-A' };
    const pizzaB = { ...pizzaPersonal, cartItemId: 'id-B' }; // Misma pizza, otra configuración (teóricamente)

    act(() => {
      result.current.addToCart(pizzaA);
      result.current.addToCart(pizzaB);
    });

    expect(result.current.cart).toHaveLength(2); // Deben ser 2 items separados
    expect(result.current.cartTotal).toBe(10.00);
  });

  it('debe calcular totales con precisión decimal correcta (Safe Math)', () => {
    const { result } = renderHook(() => useCart());

    // Simulamos un caso que suele romper JS: 0.1 + 0.2
    const itemTricky = { id: '99', name: 'Item Decimal', price: 0.10, isConfigured: false };
    const itemTricky2 = { id: '98', name: 'Item Decimal 2', price: 0.20, isConfigured: false };

    act(() => {
      result.current.addToCart(itemTricky);
      result.current.addToCart(itemTricky2);
    });

    // En JS puro esto sería 0.30000000000000004
    // Nuestra lógica debe forzar 0.3
    expect(result.current.cartTotal).toBe(0.30); 
  });

  it('debe eliminar un producto del carrito', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart(soda);
      result.current.removeFromCart(soda);
    });

    expect(result.current.cart).toHaveLength(0);
    expect(result.current.cartTotal).toBe(0);
  });
});