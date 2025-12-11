import type { ReactNode } from 'react';

// DI CONTAINER
import { container } from '../../models/di/container';

// PROVIDERS
// IMPORTANTE: Importamos desde los Contextos Reales (../) no desde la carpeta actual (./)
// para evitar duplicidad de instancias.
import { AuthProvider } from '../AuthContext'; 
import { AdminProvider } from '../AdminContext';
import { MenuProvider } from '../MenuContext';
import { KitchenProvider } from '../KitchenContext';
import { POSProvider } from '../POSContext';

// OrderProvider es el único que parece vivir solo en esta carpeta, lo mantenemos así
import { OrderProvider } from './OrderProvider'; 

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <AuthProvider>
      <AdminProvider
        settingsRepo={container.systemSettingsRepo}
        rulesRepo={container.rulesRepo}
      >
        <MenuProvider
          menuRepo={container.menuRepo}
          categoryRepo={container.categoryRepo}
        >
          <OrderProvider>
            <KitchenProvider orderRepo={container.ordersRepo}>
              <POSProvider>
                {children}
              </POSProvider>
            </KitchenProvider>
          </OrderProvider>
        </MenuProvider>
      </AdminProvider>
    </AuthProvider>
  );
};