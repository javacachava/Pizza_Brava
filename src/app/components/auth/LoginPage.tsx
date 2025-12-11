import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { ChefHat, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 👈 1. Importamos el navegador

export const LoginPage: React.FC = () => {
  const { login, loading, isAuthenticated, user } = useAuthContext(); // 👈 Traemos el estado del usuario
  const navigate = useNavigate(); // 👈 2. Inicializamos el hook
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 🤖 3. LÓGICA FALTANTE: Redirección Automática
  // Este efecto vigila si "isAuthenticated" cambia a verdadero.
  useEffect(() => {
    if (isAuthenticated && user) {
      // Si ya entró, lo mandamos a la ruta raíz '/'
      // El router se encargará de moverlo a /admin, /pos o /kitchen según su rol
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if(!email || !password) {
        setError('Por favor ingresa tus credenciales.');
        return;
    }

    try {
      await login(email, password);
      // No necesitamos navegar aquí manualmente, el useEffect de arriba lo hará
      // automáticamente en milisegundos.
    } catch (err: any) {
      console.error("Error de Login:", err);
      const msg = err?.message || 'Error de autenticación';
      
      // Traducción de errores comunes de Firebase para que se entienda mejor
      if (msg.includes('auth/invalid-credential') || msg.includes('INVALID_LOGIN_CREDENTIALS')) {
        setError('Correo o contraseña incorrectos.');
      } else if (msg.includes('auth/user-not-found')) {
        setError('Usuario no registrado.');
      } else if (msg.includes('auth/too-many-requests')) {
        setError('Cuenta bloqueada temporalmente por intentos fallidos.');
      } else if (msg.includes('network-request-failed')) {
        setError('Error de conexión. Revisa tu internet.');
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* 🎨 COLUMNA IZQUIERDA: Diseño Visual */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute left-0 bottom-0 w-64 h-64 bg-red-600 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg">
                <ChefHat size={32} />
            </div>
            <span className="text-2xl font-bold tracking-tight">Pizza Brava POS</span>
        </div>

        <div className="relative z-10 max-w-lg">
            <h2 className="text-5xl font-extrabold mb-6 leading-tight">
                El sabor del éxito <span className="text-orange-500">comienza aquí.</span>
            </h2>
            <p className="text-slate-400 text-lg">
                Plataforma integral de gestión. Control de inventario, cocina y ventas en tiempo real.
            </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
            © {new Date().getFullYear()} Pizza Brava Enterprise. v1.2
        </div>
      </div>

      {/* 🔐 COLUMNA DERECHA: Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
            
            <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold text-slate-900">Bienvenido</h1>
                <p className="mt-2 text-slate-600">Ingresa tus credenciales para acceder al panel.</p>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-start gap-3 animate-pulse">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="email"
                                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-slate-900 placeholder-slate-400"
                                placeholder="usuario@pizzabrava.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="password"
                                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-slate-900 placeholder-slate-400"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <Button 
                    type="submit" 
                    loading={loading}
                    className="w-full py-3 text-base flex justify-center items-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all hover:-translate-y-0.5"
                >
                    {!loading && <>Ingresar al Sistema <ArrowRight size={18} /></>}
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
};