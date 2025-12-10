import React, { useEffect } from 'react';
import { createBrowserRouter, useNavigate, Navigate } from 'react-router-dom';
import { MainLayout } from '../app/layout/MainLayout';
import { AdminLayout } from '../app/pages/admin/AdminLayout';
import { ProtectedRoute } from '../app/components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// Pages
import { LoginPage } from '../app/components/auth/LoginPage';
import { Dashboard } from '../app/pages/admin/Dashboard';
import { ProductsManager } from '../app/pages/admin/ProductsManager';
import { CategoriesManager } from '../app/pages/admin/CategoriesManager';
import { UsersManager } from '../app/pages/admin/UsersManager'; 
import { CashClose } from '../app/pages/admin/CashClose';
import { POSPage } from '../app/pages/pos/POSPage';
import { KitchenPage } from '../app/pages/kitchen/KitchenPage';

// Dispatcher Inteligente: Solo decide a dónde ir, no renderiza UI compleja
const RootDispatcher: React.FC = () => {
    const { user, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated && user) {
                // Redirección por rol
                if (user.role === 'admin') navigate('/admin', { replace: true });
                else if (user.role === 'kitchen') navigate('/kitchen', { replace: true });
                else navigate('/pos', { replace: true });
            } else {
                // Si no hay usuario, mandar al login
                navigate('/login', { replace: true });
            }
        }
    }, [user, isAuthenticated, loading, navigate]);

    // Pantalla de carga mientras decide (Evita el bucle visual)
    return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
    );
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />, 
        children: [
            { 
                index: true, 
                element: <RootDispatcher /> 
            },
            {
                path: 'login',
                element: <LoginPage />
            },
            // --- RUTAS ADMIN ---
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
                    { path: 'users', element: <UsersManager /> }, 
                    { path: 'orders', element: <CashClose /> }
                ]
            },
            // --- RUTA POS ---
            {
                path: 'pos',
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'cashier', 'waiter']}>
                        <POSPage />
                    </ProtectedRoute>
                )
            },
            // --- RUTA COCINA ---
            {
                path: 'kitchen',
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'kitchen']}>
                        <KitchenPage />
                    </ProtectedRoute>
                )
            },
            // Catch-all: Si la ruta no existe, volver al inicio
            {
                path: '*',
                element: <Navigate to="/" replace />
            }
        ]
    }
]);