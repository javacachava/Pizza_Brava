import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Configuración de respaldo mínima por si falla internet
const FALLBACK_INGREDIENTS = [
  "Jamón", "Pepperoni", "Salami", "Chorizo", "Pollo", "Tocino",
  "Chile verde", "Cebolla", "Maíz", "Aceitunas", "Hongos", "Piña", "Jalapeño"
];

export function useConfig() {
  const [pizzaIngredients, setPizzaIngredients] = useState(FALLBACK_INGREDIENTS);
  const [prices, setPrices] = useState({ extraIngredient: 0.75, sizeDifference: 4.00 });
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "configuration", "global_options");
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          // Solo cargamos ingredientes globales y reglas de precios
          if (data.ingredients) setPizzaIngredients(data.ingredients);
          if (data.prices) setPrices({
             extraIngredient: data.prices.extraIngredient || 0.75,
             sizeDifference: data.prices.sizeDifference || 4.00
          });
        }
      } catch (error) {
        console.warn("Usando configuración local por error de conexión.");
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, []);

  return { pizzaIngredients, prices, loadingConfig };
}