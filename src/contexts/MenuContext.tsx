import { createContext, useContext, type ReactNode } from 'react';
import { useMenu } from '../hooks/useMenu';
import type { IMenuRepository } from '../repos/interfaces/IMenuRepository';
import type { ICategoryRepository } from '../repos/interfaces/ICategoryRepository';
import type { MenuItem } from '../models/MenuItem';
import type { Category } from '../models/Category';
import type { ComboDefinition } from '../models/ComboDefinition';
import type { Flavor } from '../models/Flavor';

interface MenuProviderProps {
  menuRepo: IMenuRepository;
  categoryRepo: ICategoryRepository;
  children: ReactNode;
}

interface MenuContextState {
  items: MenuItem[]; // Legacy support if needed, or map 'products' to 'items'
  products: MenuItem[]; // New name
  categories: Category[];
  combos: ComboDefinition[]; // New property
  flavors: Flavor[]; // New property
  loading: boolean;
  refresh: () => Promise<void>;
}

const MenuContext = createContext<MenuContextState | null>(null);

export const MenuProvider = ({ menuRepo, categoryRepo, children }: MenuProviderProps) => {
  const menuState = useMenu();
  // Adapter if useMenu returns 'products' but context expects both/either
  const value = {
      ...menuState,
      items: menuState.products // Alias implicit from previous usage
  };
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};

export const useMenuContext = () => {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenuContext must be used inside MenuProvider');
  return ctx;
};
