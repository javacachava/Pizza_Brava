import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../models/User';
import { container } from '../models/di/container';
import { supabase } from '../services/supabase';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authService = container.authService;
  const [user, setUser] = useState<User | null>(null);
  
  // Iniciamos en true para verificar la sesión antes de mostrar nada
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Iniciando sistema...');

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (sessionUser: any) => {
      try {
        if (sessionUser?.email) {
          setStatusMessage(`Verificando usuario (${sessionUser.email})...`);
          
          // CORRECCIÓN: Usamos el email para recuperar el perfil
          // Esto es a prueba de fallos si los IDs no están sincronizados
          const profile = await authService.getUserByEmail(sessionUser.email);
          
          if (isMounted) {
            if (profile && profile.isActive) {
              setUser(profile);
            } else {
              console.warn("Usuario sin perfil válido o inactivo.");
              // No forzamos logout automático aquí para evitar bucles infinitos si hay error de red
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
        setUser(null);
      } finally {
        if (isMounted) {
            setLoading(false);
            setStatusMessage('');
        }
      }
    };

    // 1. Verificar sesión actual al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Escuchar cambios en tiempo real (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
        loadProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const logged = await authService.login(email, pass);
    setUser(logged);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse">{statusMessage}</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
export const useAuth = useAuthContext;