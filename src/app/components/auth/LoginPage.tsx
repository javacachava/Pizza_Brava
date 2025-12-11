import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { ChefHat, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuthContext();
  const navigate = useNavigate();
  
  // Estado local para la carga del botón (para no bloquear toda la app)
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Redirección de seguridad por si el usuario ya tiene sesión al entrar
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if(!email || !password) {
        setError('Ingresa tus credenciales.');
        return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      // Forzamos navegación inmediata tras éxito
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Error desconocido';
      if (msg.includes('auth/invalid-credential') || msg.includes('INVALID_LOGIN_CREDENTIALS')) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('Error al iniciar sesión. Revisa tu conexión.');
      }
      // Solo desactivamos el loading si falló, si tuvo éxito nos vamos de esta página
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Diseño Izquierda */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg"><ChefHat size={32} /></div>
            <span className="text-2xl font-bold">Pizza Brava POS</span>
        </div>
        <div className="relative z-10">
            <h2 className="text-5xl font-extrabold mb-6">El sabor del éxito.</h2>
            <p className="text-slate-400">Sistema integral de gestión.</p>
        </div>
        <div className="relative z-10 text-sm text-slate-500">© 2025 Pizza Brava.</div>
      </div>

      {/* Formulario Derecha */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold text-slate-900">Bienvenido</h1>
                <p className="mt-2 text-slate-600">Ingresa tus credenciales.</p>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 flex gap-2">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Correo</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input className="input-field pl-10 w-full" placeholder="usuario@pizzabrava.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Contraseña</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input type="password" className="input-field pl-10 w-full" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                </div>
                {/* Usamos isSubmitting local */}
                <Button type="submit" loading={isSubmitting} className="w-full py-3 flex justify-center items-center gap-2">
                    Ingresar <ArrowRight size={18} />
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
};