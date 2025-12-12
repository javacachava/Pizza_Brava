import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import type { MenuItem } from '../models/MenuItem'; // Ajusta imports según tu estructura
import type { Category } from '../models/Category';
import type { IMenuRepository } from '../repos/interfaces/IMenuRepository';
import type { ICategoryRepository } from '../repos/interfaces/ICategoryRepository';
import { MenuService } from '../services/domain/MenuService';

export function useMenu(menuRepo: IMenuRepository, categoryRepo: ICategoryRepository) {
  const menuService = new MenuService(menuRepo, categoryRepo);
  const { isAuthenticated } = useAuthContext();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    // 🛑 ESCUDO: Si no hay usuario, no hacemos nada.
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const itemsList = await menuService.getMenu();
      const categoriesList = await menuService.getCategories();
      setItems(itemsList);
      setCategories(categoriesList);
    } catch (e) {
      console.error("Error cargando menú:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
        load();
    }
  }, [isAuthenticated, load]);

  // 👇 ESTO FALTABA: Retornar el objeto que espera el Contexto
  return {
    items,
    categories,
    loading,
    refresh: load
  };
}