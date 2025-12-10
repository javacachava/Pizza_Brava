import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/pos'); 
        } catch (err) {
            setError('Credenciales incorrectas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
            {/* Fondo decorativo */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"></div>

            <div className="bg-white/95 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-white/20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pizza Brava 🍕</h1>
                    <p className="text-slate-500 mt-2 text-sm">Sistema de Gestión Integrado</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2 border border-red-100">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Email</label>
                        <input 
                            type="email" 
                            className="input-field bg-slate-50" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="admin@pizzabrava.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Contraseña</label>
                        <input 
                            type="password" 
                            className="input-field bg-slate-50"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <Button type="submit" isLoading={loading} className="w-full h-12 text-base shadow-orange-500/25">
                        Iniciar Sesión
                    </Button>
                </form>
            </div>
        </div>
    );
};