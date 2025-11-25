export const PIZZA_DEFAULT_CONFIG = {
  sizes: ["Grande", "Personal"],
  families: ["Clásica", "Especialidad"],
  prices: {
    Grande: {
      Clásica: 13.0,
      Especialidad: 15.0
    },
    Personal: {
      Clásica: 6.0,
      Especialidad: 7.5
    }
  }
};

/**
 * Dado un producto base de pizza y la selección del usuario,
 * devuelve el item listo para ir al carrito.
 */
export function buildPizzaCartItem(baseProduct, size, family) {
  const cfg = PIZZA_DEFAULT_CONFIG;

  const price =
    cfg.prices?.[size]?.[family] ?? baseProduct.price ?? 0;

  return {
    ...baseProduct,
    // Hacemos único el id por combinación
    id: `${baseProduct.id}_${size}_${family}`,
    name: `${baseProduct.name} ${size} (${family})`,
    price,
    pizzaOptions: {
      size,
      family
    }
  };
}
