import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { container } from '../models/di/container';
import type { MenuItem } from '../models/MenuItem';
import type { Category } from '../models/Category';
import type { ComboDefinition } from '../models/ComboDefinition';
import { MenuService } from '../services/domain/MenuService';
import { ComboService } from '../services/domain/ComboService';

export function useMenu() {
  const { isAuthenticated } = useAuthContext();
  
  // Instancia servicios usando inyección manual del container
  const menuService = new MenuService(container.menuRepo, container.categoryRepo);
  // Asumiendo que el constructor de ComboService recibe ComboDefinitionRepository y MenuRepository
  const comboService = new ComboService(container.comboDefRepo, container.menuRepo);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [combos, setCombos] = useState<ComboDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      // Carga paralela para performance óptima
      const [fetchedItems, fetchedCategories, fetchedCombos] = await Promise.all([
        menuService.getMenu(),
        menuService.getCategories(),
        comboService.getDefinitions()
      ]);

      setItems(fetchedItems);
      setCategories(fetchedCategories);
      setCombos(fetchedCombos);
    } catch (e) {
      console.error("Error crítico cargando menú POS:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  return {
    categories,
    products: items, // Alias 'products' para la UI
    combos,
    loading,
    refresh: load
  };
}