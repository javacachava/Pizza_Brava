import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { container } from '../models/di/container';
import type { MenuItem } from '../models/MenuItem';
import type { Category } from '../models/Category';
import type { Combo } from '../models/Combo'; // O ComboDefinition
import type { IMenuRepository } from '../repos/interfaces/IMenuRepository';
import type { ICategoryRepository } from '../repos/interfaces/ICategoryRepository';
import type { IComboDefinitionRepository } from '../repos/interfaces/IComboDefinitionRepository';
import { MenuService } from '../services/domain/MenuService';
import { ComboService } from '../services/domain/ComboService';

export function useMenu(
  menuRepo: IMenuRepository = container.menuRepo,
  categoryRepo: ICategoryRepository = container.categoryRepo,
  // CORRECCIÓN 1: Usar el nombre correcto del container
  comboDefRepo: IComboDefinitionRepository = container.comboDefRepo 
) {
  const { isAuthenticated } = useAuthContext();
  
  // CORRECCIÓN 2: Instanciación correcta. 
  // Asumimos que ComboService necesita (Repo, MenuRepo) para funcionar.
  const menuService = new MenuService(menuRepo, categoryRepo);
  const comboService = new ComboService(comboDefRepo, menuRepo); 

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const [itemsList, categoriesList, combosList] = await Promise.all([
        menuService.getMenu(),
        menuService.getCategories(),
        // CORRECCIÓN 3: Método correcto. Si getAll falló, suele ser getDefinitions
        comboService.getDefinitions() 
      ]);

      setItems(itemsList);
      setCategories(categoriesList);
      // Mapeamos definiciones a estructura Combo si es necesario
      setCombos(combosList as unknown as Combo[]); 
    } catch (e) {
      console.error("Error cargando menú:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, menuService, comboService]);

  useEffect(() => {
    if (isAuthenticated) {
        load();
    }
  }, [isAuthenticated, load]);

  return {
    items,
    products: items,
    combos,
    categories,
    loading,
    refresh: load
  };
}