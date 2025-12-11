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
  
  // Estado de carga inicial
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Iniciando sistema...');

  useEffect(() => {
    let isMounted = true;
    
    // Escuchamos cambios en la autenticación
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (!isMounted) return;

      try {
        if (currentUser) {
          setStatusMessage(`Verificando usuario (${currentUser.email})...`);
          
          try {
            // Intentamos obtener el perfil extendido
            const profile = await authService.getUserById(currentUser.uid);
            
            if (isMounted) {
              if (profile && profile.isActive) {
                setUser(profile);
              } else {
                console.warn("Usuario sin perfil válido o inactivo.");
                await authService.logout();
                setUser(null);
              }
            }
          } catch (profileError: any) {
            console.error("[Auth] Error al cargar perfil:", profileError);
            // Si falla la carga del perfil, cerramos sesión para evitar el limbo
            await authService.logout();
            setUser(null);
          }
        } else {
          // No hay usuario logueado
          setUser(null);
        }
      } catch (globalError) {
        console.error("[Auth] Error general:", globalError);
        setUser(null);
      } finally {
        // IMPORTANTE: Esto asegura que el loading SIEMPRE se quite
        if (isMounted) {
            setLoading(false);
            setStatusMessage('');
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    // No activamos loading global aquí, dejamos que el formulario lo maneje
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

  // Pantalla de carga (solo al inicio)
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