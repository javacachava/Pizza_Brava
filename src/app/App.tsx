import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from '../contexts/AuthContext';
import { MenuProvider } from '../contexts/MenuContext';
import { POSProvider } from '../contexts/POSContext';
import { KitchenProvider } from '../contexts/KitchenContext';
import { AdminProvider } from '../contexts/AdminContext';

// Un componente wrapper para los Providers de Datos que requieren Auth
const DataProviders: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AdminProvider>
    <MenuProvider>
      <POSProvider>
        <KitchenProvider>
          {children}
        </KitchenProvider>
      </POSProvider>
    </MenuProvider>
  </AdminProvider>
);

const App: React.FC = () => {
  return (
    <React.StrictMode>
      {/* AuthProvider es el nivel más alto */}
      <AuthProvider>
        <DataProviders>
          {/* SE AGREGÓ EL FLAG 'future' PARA SILENCIAR EL WARNING V7 */}
          <RouterProvider 
            router={router} 
            future={{
              v7_startTransition: true,
            }}
          />
        </DataProviders>
      </AuthProvider>
    </React.StrictMode>
  );
};

export default App;