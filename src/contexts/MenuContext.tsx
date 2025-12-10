import React, { createContext, useContext, useEffect, useState } from 'react';
import { MenuService } from '../services/domain/MenuService';
import type { Category } from '../models/Category';
import type { MenuItem } from '../models/MenuItem';
import { useAuth } from './AuthContext'; // <--- IMPORTANTE: Importamos el Auth

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
    const { user, loading: authLoading } = useAuth(); // <--- IMPORTANTE: Obtenemos el estado de auth
    const [menu, setMenu] = useState<MenuWithItems[]>([]);
    const [loading, setLoading] = useState(false); // <--- Iniciamos en false para no bloquear si no hay usuario

    const refreshMenu = async () => {
        // SEGURIDAD: Si no hay usuario, no hacemos la petición a Firebase
        if (!user) return;

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
        // Solo intentamos cargar cuando la autenticación haya terminado de verificar
        if (!authLoading && user) {
            refreshMenu();
        }
    }, [user, authLoading]); // <--- Se ejecuta cuando cambia el usuario

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