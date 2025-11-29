// src/hooks/useConfig.js
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { FALLBACK_CONFIG } from "../constants/productConfig";

const CACHE_KEY = "pizza_brava_config_v2";

export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [usingOfflineConfig, setUsingOfflineConfig] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const normalizeConfig = (raw = {}) => {
      const fallback = FALLBACK_CONFIG || {};

      // Mezcla reglas de Firestore (rules o prices) con las de fallback
      const rulesFromDoc = raw.rules || {};
      const pricesFromDoc = raw.prices || {};

      let mergedRules = {
        ...(fallback.rules || {}),
        ...rulesFromDoc,
      };

      // Si el doc viejo guardó "prices.extraIngredient / sizeDifference",
      // las metemos en rules para mantener compatibilidad
      if (pricesFromDoc.extraIngredient != null) {
        const val = Number(pricesFromDoc.extraIngredient) || 0;
        mergedRules.ingredientPrice = val;
        mergedRules.ingredient_extra_price = val;
      }

      if (pricesFromDoc.sizeDifference != null) {
        const diff = Number(pricesFromDoc.sizeDifference) || 0;
        const baseSizes = fallback.rules?.sizes || {};
        const currentSizes = mergedRules.sizes || {};
        mergedRules.sizes = {
          ...baseSizes,
          ...currentSizes,
          Grande: {
            ...(baseSizes.Grande || {}),
            ...(currentSizes.Grande || {}),
            priceModifier: diff,
          },
        };
      }

      return {
        ...fallback,
        ...raw,
        ingredients: raw.ingredients ?? fallback.ingredients ?? [],
        sides: raw.sides ?? fallback.sides ?? [],
        drinks: raw.drinks ?? fallback.drinks ?? [],
        rules: mergedRules,
      };
    };

    const loadConfig = async () => {
      try {
        // 1) Intentar sacar de cache local para arranque instantáneo
        if (typeof window !== "undefined") {
          const cached = window.localStorage.getItem(CACHE_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              const normalized = normalizeConfig(parsed);
              if (!cancelled) {
                setConfig(normalized);
                setUsingOfflineConfig(true);
                setLoadingConfig(false); // la UI ya puede pintar algo
              }
            } catch {
              // Cache corrupta, se ignora
            }
          } else {
            // Sin cache: por lo menos tenemos fallback
            if (!cancelled) {
              setConfig(normalizeConfig({}));
            }
          }
        } else {
          if (!cancelled) {
            setConfig(normalizeConfig({}));
          }
        }

        // 2) Intentar traer la versión real de Firestore
        const ref = doc(db, "configuration", "global_options");
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          // No hay doc en Firestore: nos quedamos con fallback
          if (!cancelled) {
            setConfig((prev) => prev || normalizeConfig({}));
            setUsingOfflineConfig(true);
          }
          return;
        }

        const remoteData = snap.data() || {};
        const normalizedRemote = normalizeConfig(remoteData);

        if (!cancelled) {
          setConfig(normalizedRemote);
          setUsingOfflineConfig(false);
        }

        // Actualizar cache con lo que vino de Firestore (crudo)
        if (typeof window !== "undefined") {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(remoteData));
        }
      } catch (err) {
        console.error("Error cargando configuración:", err);
        if (!cancelled) {
          // Fallback duro
          setConfig((prev) => prev || normalizeConfig({}));
          setUsingOfflineConfig(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingConfig(false);
        }
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loadingConfig, usingOfflineConfig };
}
