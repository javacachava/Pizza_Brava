import { useAdminContext } from '../contexts/AdminContext';

export const useAdmin = () => {
    return useAdminContext();
};