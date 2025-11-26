import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Referencia al documento 'global_options' en la colección 'configuration'
        const docRef = doc(db, "configuration", "global_options");
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          
          // Estructuramos la data para que la app la entienda fácil
          setConfig({
            ingredients: data.ingredients || [],
            sides: data.sides || [],
            drinks: data.drinks || [],
            rules: {
              ingredientPrice: data.prices?.extraIngredient || 0,
              sizes: {
                Personal: { label: "Personal", priceModifier: 0 },
                // Aquí usamos el valor de la DB para la diferencia de precio
                Grande: { label: "Gigante", priceModifier: data.prices?.sizeDifference || 0 }
              }
            }
          });
        } else {
          console.error("FATAL: No se encontró la configuración en Firebase (configuration/global_options)");
        }
      } catch (error) {
        console.error("Error descargando configuración:", error);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loadingConfig };
}