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
  
  // Loading global: solo para la carga inicial de la página al abrirse o refrescar
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (currentUser) {
        try {
          const profile = await authService.getUserById(currentUser.uid);
          if (profile && profile.isActive) {
            setUser(profile);
          } else {
            await authService.logout();
            setUser(null);
          }
        } catch (e) {
          console.error("Error sesión:", e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      // Solo liberamos la app cuando estamos seguros del estado inicial
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    // ⚠️ NO activamos loading global aquí para evitar desmontar toda la UI
    const logged = await authService.login(email, pass);
    setUser(logged);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  // 🛡️ Muro de contención: Solo bloquea si es la carga INICIAL
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Cargando sistema...</p>
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