import type { ReactNode } from 'react';
import { container } from '../../models/di/container';

// Importamos desde los archivos originales para evitar duplicados
import { AuthProvider, useAuthContext } from '../AuthContext'; 
import { AdminProvider } from '../AdminContext';
import { MenuProvider } from '../MenuContext';
import { KitchenProvider } from '../KitchenContext';
import { POSProvider } from '../POSContext';
import { OrderProvider } from './OrderProvider'; 

interface AppProvidersProps {
  children: ReactNode;
}

// Componente interno que decide qué cargar según el rol
const RoleBasedProviders = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuthContext();

  if (loading) return null; // O un spinner

  // 1. Empezamos con el contenido base (el Router)
  let content = <>{children}</>;

  // 2. Providers de Cocina (Solo si es admin o cocina)
  // Envuelven al contenido base
  if (user?.role === 'admin' || user?.role === 'cocina') {
    content = (
      <KitchenProvider orderRepo={container.ordersRepo}>
        {content}
      </KitchenProvider>
    );
  }

  // 3. Providers de Venta/Admin (Admin y Recepción)
  // Envuelven a lo anterior (incluyendo cocina si aplica)
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

  // 5. FINALMENTE: El MenuProvider envuelve a TODO lo demás.
  // Esto asegura que POSProvider y KitchenProvider puedan acceder al Menú si lo necesitan,
  // y que POSPage siempre encuentre el contexto, sin importar qué otros providers estén activos.
  return (
    <MenuProvider menuRepo={container.menuRepo} categoryRepo={container.categoryRepo}>
       {content}
    </MenuProvider>
  );
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