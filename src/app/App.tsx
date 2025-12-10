import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

import { AdminProvider } from '../contexts/AdminContext';
import { MenuProvider } from '../contexts/MenuContext';
import { POSProvider } from '../contexts/POSContext';
import { KitchenProvider } from '../contexts/KitchenContext';

import { ChatWidget } from './components/chatbot/ChatWidget'; 

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <AdminProvider>
        <MenuProvider>
          <POSProvider>
            <KitchenProvider>

              <RouterProvider router={router} />

              <ChatWidget />

            </KitchenProvider>
          </POSProvider>
        </MenuProvider>
      </AdminProvider>
    </React.StrictMode>
  );
};

export default App;
