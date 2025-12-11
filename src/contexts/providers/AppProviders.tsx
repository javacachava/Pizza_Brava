import type { ReactNode } from 'react';
import { container } from '../../models/di/container';

// Importamos desde los archivos originales para evitar duplicados
import { AuthProvider, useAuthContext } from '../AuthContext'; 
import { AdminProvider } from '../AdminContext';
import { MenuProvider } from '../MenuContext';
import { KitchenProvider } from '../KitchenContext';
import { POSProvider } from '../POSContext';
import { OrderProvider } from './OrderProvider'; // Este suele estar aparte

interface AppProvidersProps {
  children: ReactNode;
}

// Componente interno que decide qué cargar según el rol
const RoleBasedProviders = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuthContext();

  if (loading) return null; // O un spinner

  // 1. Providers Comunes (Todos necesitan Menú y Auth)
  let content = (
    <MenuProvider menuRepo={container.menuRepo} categoryRepo={container.categoryRepo}>
       {children}
    </MenuProvider>
  );

  // 2. Providers de Cocina (Solo si es admin o cocina)
  if (user?.role === 'admin' || user?.role === 'cocina') {
    content = (
      <KitchenProvider orderRepo={container.ordersRepo}>
        {content}
      </KitchenProvider>
    );
  }

  // 3. Providers de Venta/Admin (Admin y Recepción)
  if (user?.role === 'admin' || user?.role === 'recepcion') {
    content = (
      <OrderProvider>
        <POSProvider>
          {content}
        </POSProvider>
      </OrderProvider>
    );
  }

  // 4. Provider de Admin (SOLO Admin)
  if (user?.role === 'admin') {
    content = (
      <AdminProvider settingsRepo={container.systemSettingsRepo} rulesRepo={container.rulesRepo}>
        {content}
      </AdminProvider>
    );
  }

  return <>{content}</>;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <AuthProvider>
      <RoleBasedProviders>
        {children}
      </RoleBasedProviders>
    </AuthProvider>
  );
};