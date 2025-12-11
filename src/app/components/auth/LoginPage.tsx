import React, { useState } from 'react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { ChefHat, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if(!email || !password) {
        setError('Por favor ingresa tus credenciales.');
        return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      // Mensajes de error más amigables
      const msg = err?.message || 'Error de autenticación';
      if (msg.includes('auth/invalid-credential')) setError('Correo o contraseña incorrectos.');
      else if (msg.includes('auth/user-not-found')) setError('Usuario no registrado.');
      else setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* COLUMNA IZQUIERDA: Branding Visual */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Fondo decorativo abstracto */}
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
                El sabor de la excelencia <span className="text-orange-500">empieza aquí.</span>
            </h2>
            <p className="text-slate-400 text-lg">
                Sistema integral de gestión para restaurantes. Controla pedidos, cocina y administración en un solo lugar.
            </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
            © {new Date().getFullYear()} Pizza Brava Enterprise. v1.0.0
        </div>
      </div>

      {/* COLUMNA DERECHA: Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
            
            <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold text-slate-900">Bienvenido de nuevo</h1>
                <p className="mt-2 text-slate-600">Ingresa a tu cuenta para gestionar el restaurante.</p>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-start gap-3 animate-enter">
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
                    className="w-full py-3 text-base flex justify-center items-center gap-2 shadow-lg shadow-orange-500/20"
                >
                    {!loading && <>Ingresar al Sistema <ArrowRight size={18} /></>}
                </Button>
            </form>

            <div className="text-center pt-4">
                <p className="text-xs text-slate-400">
                    ¿Olvidaste tu contraseña? Contacta al administrador del sistema.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};