import React from 'react';
import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom';
import { AdminLayout } from './pages/admin/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext'; // Ajusta la ruta si es necesario

// Auth Pages
import { LoginPage } from './components/auth/LoginPage';

// Admin Pages
import { Dashboard } from './pages/admin/Dashboard';
import { ProductsManager } from './pages/admin/ProductsManager';
import { CategoriesManager } from './pages/admin/CategoriesManager';
import { UsersManager } from './pages/admin/UsersManager'; 
import { CashClose } from './pages/admin/CashClose';
import { CombosManager } from './pages/admin/CombosManager';
import { IngredientsManager } from './pages/admin/IngredientsManager';
import { FlavorsManager } from './pages/admin/FlavorsManager';
import { SizesManager } from './pages/admin/SizesManager';
import { RulesManager } from './pages/admin/RulesManager';

// Operational Pages
import { POSPage } from './pages/pos/POSPage';
import { KitchenPage } from './pages/kitchen/KitchenPage';

// Componente: Error Boundary simple
const ErrorPage = () => {
    const error: any = useRouteError();
    return (
        <div className="h-screen flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-2xl font-bold text-red-600">Algo salió mal</h1>
            <p className="text-gray-600">{error.statusText || error.message}</p>
        </div>
    );
};

// Componente: Redirección inteligente basada en Rol
const RootRedirect: React.FC = () => {
    const { user, isAuthenticated, loading } = useAuth();

    // 1. Si está cargando la sesión inicial, mostramos spinner
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // 2. Si NO está autenticado, al Login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }
    
    // 3. Redirección por rol (Lógica de Negocio)
    // Usamos toLowerCase() por seguridad
    const role = user.role?.toLowerCase();

    switch (role) {
        case 'admin': return <Navigate to="/admin" replace />;
        case 'recepcion': return <Navigate to="/pos" replace />;
        case 'cocina': return <Navigate to="/kitchen" replace />;
        default: 
            // FALLBACK SEGURO: Si el rol no existe o está mal escrito,
            // NO redirigimos a login (bucle infinito), mostramos mensaje.
            return (
                <div className="h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                    <h1 className="text-xl font-bold text-gray-800">Acceso Restringido</h1>
                    <p className="text-gray-600 mb-4">
                        Tu usuario ({user.email}) tiene el rol <span className="font-mono bg-gray-200 px-1 rounded">{user.role}</span>, 
                        el cual no tiene un panel asignado.
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="text-orange-600 hover:underline"
                    >
                        Recargar
                    </button>
                </div>
            );
    }
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootRedirect />,
        errorElement: <ErrorPage />
    },
    {
        path: 'login',
        element: <LoginPage />
    },
    {
        path: 'admin',
        element: (
            <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: '', element: <Dashboard /> },
            { path: 'products', element: <ProductsManager /> },
            { path: 'categories', element: <CategoriesManager /> },
            { path: 'combos', element: <CombosManager /> },
            { path: 'orders', element: <CashClose /> },
            { path: 'users', element: <UsersManager /> },
            { path: 'ingredients', element: <IngredientsManager /> },
            { path: 'flavors', element: <FlavorsManager /> },
            { path: 'sizes', element: <SizesManager /> },
            { path: 'rules', element: <RulesManager /> },
        ]
    },
    {
        path: 'pos',
        element: (
            <ProtectedRoute allowedRoles={['admin', 'recepcion']}>
                <POSPage />
            </ProtectedRoute>
        )
    },
    {
        path: 'kitchen',
        element: (
            <ProtectedRoute allowedRoles={['admin', 'cocina']}>
                <KitchenPage />
            </ProtectedRoute>
        )
    },
    {
        path: '*',
        element: <Navigate to="/" replace />
    }
]);