import { useMenuContext } from '../contexts/MenuContext';

export const useMenu = () => {
    const { menu, loading, refreshMenu } = useMenuContext();
    return { 
        categories: menu, 
        isLoading: loading, 
        reload: refreshMenu 
    };
};