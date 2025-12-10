import React, { createContext, useContext, useEffect, useState } from 'react';
import { MenuService } from '../services/domain/MenuService';
import type { Category } from '../models/Category';
import type { MenuItem } from '../models/MenuItem';

interface MenuWithItems extends Category {
    items: MenuItem[];
}

interface MenuContextType {
    menu: MenuWithItems[];
    loading: boolean;
    refreshMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);
const menuService = new MenuService();

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [menu, setMenu] = useState<MenuWithItems[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshMenu = async () => {
        setLoading(true);
        try {
            const data = await menuService.getFullMenu();
            setMenu(data);
        } catch (error) {
            console.error("Error loading menu", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshMenu();
    }, []);

    return (
        <MenuContext.Provider value={{ menu, loading, refreshMenu }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenuContext = () => {
    const context = useContext(MenuContext);
    if (!context) throw new Error("useMenuContext must be used within MenuProvider");
    return context;
};