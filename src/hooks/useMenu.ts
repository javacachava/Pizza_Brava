import { useEffect, useState, useCallback } from 'react';
import type { MenuItem } from '../models/MenuItem';
import type { Category } from '../models/Category';
import type { IMenuRepository } from '../repos/interfaces/IMenuRepository';
import type { ICategoryRepository } from '../repos/interfaces/ICategoryRepository';
import { MenuService } from '../services/domain/MenuService';
import { useAuthContext } from '../contexts/AuthContext'; // Importar Auth

export function useMenu(menuRepo: IMenuRepository, categoryRepo: ICategoryRepository) {
  const menuService = new MenuService(menuRepo, categoryRepo);
  const { isAuthenticated } = useAuthContext(); // Obtener estado de auth

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return; // 🛑 Bloqueo si no hay usuario

    setLoading(true);
    try {
      const itemsList = await menuService.getMenu();
      const categoriesList = await menuService.getCategories();

      setItems(itemsList);
      setCategories(categoriesList);
    } catch (e) {
      console.error("Error loading menu:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]); // Dependencia agregada

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  return { items, categories, loading, refresh: load };
}