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
  
  // Estados para el diagnóstico
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Iniciando servicios...');
  const [showEmergencyExit, setShowEmergencyExit] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Timer de seguridad: Si en 5 segundos no entra, mostramos botón de emergencia
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        setStatusMessage('El sistema está tardando más de lo normal...');
        setShowEmergencyExit(true);
      }
    }, 5000);

    const runAuthCheck = () => {
        setStatusMessage('Conectando con Firebase Auth...');
        
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
          if (!isMounted) return;

          if (currentUser) {
            try {
              setStatusMessage(`Usuario detectado (${currentUser.email}). Buscando perfil...`);
              
              // Intentamos obtener el perfil de base de datos
              const profile = await authService.getUserById(currentUser.uid);
              
              if (!isMounted) return;

              if (profile) {
                if (profile.isActive) {
                    setStatusMessage('Perfil verificado. Entrando al sistema...');
                    setUser(profile);
                } else {
                    setStatusMessage('Usuario inactivo. Cerrando sesión...');
                    await authService.logout();
                    setUser(null);
                }
              } else {
                setStatusMessage('Perfil no encontrado en base de datos. Cerrando sesión...');
                // Si existe en Auth pero no en BD, lo sacamos
                await authService.logout();
                setUser(null);
              }
            } catch (e: any) {
              console.error("[Auth] Error crítico:", e);
              setStatusMessage(`Error cargando perfil: ${e.message || 'Desconocido'}`);
              // No quitamos el loading inmediatamente para que el usuario lea el error
              // Pero habilitamos la salida de emergencia
              setShowEmergencyExit(true);
              return; // Detenemos aquí para mostrar el error
            }
          } else {
            setStatusMessage('No hay sesión activa.');
            setUser(null);
          }

          // Todo salió bien
          setStatusMessage('Listo.');
          setLoading(false);
          clearTimeout(safetyTimer);
        });

        return unsubscribe;
    };

    const unsubscribeFn = runAuthCheck();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      if (typeof unsubscribeFn === 'function') unsubscribeFn();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    // No activamos loading global aquí para no bloquear la UI si falla el login
    // El formulario de Login manejará su propio estado
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

  // --- PANTALLA DE CARGA CON DIAGNÓSTICO ---
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        {/* Spinner */}
        <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mb-6"></div>
        
        {/* Mensaje de Estado (Diagnóstico) */}
        <p className="text-slate-700 font-medium text-lg animate-pulse">
            {statusMessage}
        </p>
        
        {/* Botón de Emergencia (Aparece a los 5 seg o si hay error) */}
        {showEmergencyExit && (
            <div className="mt-8 p-4 bg-white border border-slate-200 rounded-lg shadow-sm max-w-sm">
                <p className="text-slate-500 text-sm mb-3">
                    Parece que hay problemas de conexión o el servidor no responde.
                </p>
                <button 
                    onClick={() => {
                        setLoading(false); // Forzamos quitar la pantalla de carga
                        authService.logout().catch(() => {}); // Intentamos limpiar por si acaso
                    }}
                    className="px-4 py-2 bg-slate-800 text-white text-sm rounded hover:bg-slate-700 transition-colors w-full"
                >
                    Forzar ir al Login
                </button>
            </div>
        )}
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