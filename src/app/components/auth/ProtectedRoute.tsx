import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import type { UserRole } from '../../../models/User';

interface Props {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // 1. Mientras carga, mostrar spinner (evita redirecciones prematuras)
    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
                <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-500 font-medium">Verificando credenciales...</p>
            </div>
        );
    }

    // 2. Si terminó de cargar y no hay usuario -> Login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Verificación de Rol
    if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
        // Si intenta entrar donde no debe, lo mandamos a su home segura
        const safePath = user.role === 'kitchen' ? '/kitchen' : '/pos';
        return <Navigate to={safePath} replace />;
    }

    // 4. Todo correcto
    return <>{children}</>;
};