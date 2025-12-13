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
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Iniciando sistema...');

  useEffect(() => {
    let isMounted = true;

    // Función para cargar perfil
    const loadProfile = async (uid: string, email?: string) => {
      if (email) setStatusMessage(`Verificando usuario (${email})...`);
      try {
        const profile = await authService.getUserById(uid);
        if (isMounted) {
          if (profile && profile.isActive) {
            setUser(profile);
          } else {
            console.warn("Usuario sin perfil o inactivo.");
            await authService.logout();
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Error cargando perfil", err);
        setUser(null);
      } finally {
        if (isMounted) {
            setLoading(false);
            setStatusMessage('');
        }
      }
    };

    // 1. Verificar sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    // 2. Escuchar cambios (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
        loadProfile(session.user.id, session.user.email);
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
    // El loading lo maneja el listener onAuthStateChange o el form local
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