import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { FALLBACK_CONFIG } from '../constants/productConfig';

const CACHE_KEY = 'pizza_brava_config_v1';

export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [usingOfflineConfig, setUsingOfflineConfig] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      // 1. NIVEL 1: Intentar cargar de caché local (LocalStorage) para arranque instantáneo
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsedConfig = JSON.parse(cachedData);
          setConfig(parsedConfig);
          setLoadingConfig(false); // Desbloqueamos la UI inmediatamente con datos viejos
        } catch (e) {
          console.warn("Caché corrupto, ignorando.");
        }
      }

      // Función de carga con Reintentos (Exponential Backoff)
      const fetchFromFirebase = async (retryCount = 0) => {
        try {
          const docRef = doc(db, "configuration", "global_options");
          const snapshot = await getDoc(docRef);

          if (snapshot.exists()) {
            const data = snapshot.data();
            
            // Mapear datos crudos a estructura de la app
            const liveConfig = {
              ingredients: data.ingredients || FALLBACK_CONFIG.ingredients,
              sides: data.sides || FALLBACK_CONFIG.sides,
              drinks: data.drinks || FALLBACK_CONFIG.drinks,
              rules: {
                ingredientPrice: data.prices?.extraIngredient ?? FALLBACK_CONFIG.rules.ingredientPrice,
                sizes: {
                  Personal: { label: "Personal", priceModifier: 0 },
                  Grande: { 
                    label: "Gigante", 
                    priceModifier: data.prices?.sizeDifference ?? FALLBACK_CONFIG.rules.sizes.Grande.priceModifier 
                  }
                }
              }
            };

            // Guardar en estado y actualizar caché
            setConfig(liveConfig);
            localStorage.setItem(CACHE_KEY, JSON.stringify(liveConfig));
            setUsingOfflineConfig(false);
          } else {
            throw new Error("Configuración no encontrada en DB");
          }
        } catch (error) {
          console.warn(`Intento ${retryCount + 1} fallido:`, error.message);

          if (retryCount < 3) {
            // Reintentar con espera exponencial: 1s, 2s, 4s
            const delay = Math.pow(2, retryCount) * 1000;
            setTimeout(() => fetchFromFirebase(retryCount + 1), delay);
          } else {
            // 3. NIVEL FINAL: Si fallan todos los reintentos y no había caché
            if (!cachedData) {
              console.error("Fallo total de red. Usando configuración de emergencia.");
              setConfig(FALLBACK_CONFIG);
            }
            // Si ya teníamos caché, nos quedamos con esa.
            // Marcamos flag para (opcionalmente) mostrar un icono de "Sin conexión"
            setUsingOfflineConfig(true);
          }
        } finally {
          // Asegurar que la pantalla de carga se quite pase lo que pase
          setLoadingConfig(false);
        }
      };

      // Iniciar carga remota (segundo plano si ya había caché)
      fetchFromFirebase();
    };

    loadConfig();
  }, []);

  return { config, loadingConfig, usingOfflineConfig };
}