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
  const [loading, setLoading] = useState(true); // Iniciamos cargando para verificar sesión

  // Efecto para persistencia de sesión (Si recargas la página, sigues logueado)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (currentUser) {
        try {
          // Si Firebase dice que hay usuario, buscamos su perfil en Firestore
          const profile = await authService.getUserById(currentUser.uid);
          if (profile && profile.isActive) {
            setUser(profile);
          } else {
            // Si no tiene perfil o está inactivo, forzamos logout
            await authService.logout();
            setUser(null);
          }
        } catch (e) {
          console.error("Error fetching user profile", e);
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
    setLoading(true);
    // AuthService ahora hace el trabajo sucio de Firebase + Firestore
    const logged = await authService.login(email, pass);
    setUser(logged);
    setLoading(false);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
export const useAuth = useAuthContext;