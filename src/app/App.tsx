import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AppProviders } from '../contexts/providers/AppProviders';
import { supabase } from '../services/supabase';

export const App = () => {
  
  // 👇 EFECTO DE PRUEBA DE CONEXIÓN
  useEffect(() => {
    console.log("📡 Intentando conectar con Supabase...");
    
    supabase
      .from('menu_items') // Intentamos leer una tabla (aunque no exista aún)
      .select('*')
      .limit(1)
      .then(({ data, error }) => {
        console.log('✅ RESPUESTA SUPABASE:');
        console.log('   Datos:', data);
        console.log('   Error:', error);
      });
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};