import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/pos'); 
        } catch (err) {
            setError('Credenciales incorrectas. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans text-slate-800 selection:bg-orange-100 selection:text-orange-600">
            {/* --- SECCIÓN VISUAL (IZQUIERDA) --- */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden">
                {/* Imagen de Fondo (Pizza de alta calidad) */}
                <img 
                    src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop" 
                    alt="Pizza Brava Background" 
                    className="absolute inset-0 w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-[20s] ease-in-out"
                />
                
                {/* Overlay Degradado */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                {/* Contenido de Marca */}
                <div className="relative z-10 flex flex-col justify-end p-16 w-full">
                    <div className="animate-enter">
                        <div className="inline-block bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wider uppercase">
                            Sistema v1.0
                        </div>
                        <h1 className="text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                            Pasión por <br/>
                            <span className="text-orange-500">el Sabor.</span>
                        </h1>
                        <p className="text-slate-300 text-lg max-w-md leading-relaxed">
                            Gestiona pedidos, cocina y administración desde una plataforma unificada diseñada para la velocidad.
                        </p>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN FORMULARIO (DERECHA) --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 relative">
                {/* Decoración de fondo sutil */}
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="100" cy="100" r="100" fill="#ff6b00"/>
                    </svg>
                </div>

                <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 relative z-10">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Bienvenido 👋</h2>
                        <p className="text-slate-500">Ingresa tus credenciales para acceder al sistema.</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-sm animate-pulse flex items-center gap-3 text-sm">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campo Email */}
                        <div className={`transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-400">✉️</span>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400"
                                    placeholder="usuario@pizzabrava.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo Password */}
                        <div className={`transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-400">🔒</span>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Botón de Acción */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`
                                w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-orange-500/30
                                transition-all duration-300 transform
                                bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700
                                active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                                flex items-center justify-center gap-3
                            `}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Accediendo...
                                </>
                            ) : (
                                <>
                                    Ingresar al Sistema
                                    <span className="text-xl">➜</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-400">
                        &copy; 2025 Pizza Brava. Todos los derechos reservados.
                    </div>
                </div>
            </div>
        </div>
    );
};