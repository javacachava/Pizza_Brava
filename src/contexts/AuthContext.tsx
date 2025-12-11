import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../models/User';
import { container } from '../models/di/container';
import { onAuthStateChanged } from 'firebase/auth';
import { auth as firebaseAuth } from '../services/firebase';

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
  
  // Principio de Responsabilidad Única:
  // Este loading solo indica si "estamos verificando la sesión inicial de Firebase".
  // NO debe usarse para indicar que un botón de login está cargando.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      // No activamos setLoading(true) aquí para evitar parpadeos innecesarios en recargas suaves
      if (currentUser) {
        try {
          const profile = await authService.getUserById(currentUser.uid);
          if (profile && profile.isActive) {
            setUser(profile);
          } else {
            // Usuario existe en Firebase pero no en BD o inactivo
            await authService.logout();
            setUser(null);
          }
        } catch (e) {
          console.error("[Auth] Error validando sesión:", e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    // SOLID: No manipulamos el estado global 'loading' aquí.
    // La UI específica (Login form) debe encargarse de su propio feedback visual.
    const logged = await authService.login(email, pass);
    setUser(logged);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  // Bloqueo solo durante la carga INICIAL (Refresh de página)
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Iniciando sistema...</p>
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