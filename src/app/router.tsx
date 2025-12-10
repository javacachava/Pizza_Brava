import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { AdminLayout } from './pages/admin/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// Pages
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './pages/admin/Dashboard';
import { ProductsManager } from './pages/admin/ProductsManager';
import { CategoriesManager } from './pages/admin/CategoriesManager';
import { UsersManager } from './pages/admin/UsersManager'; 
import { CashClose } from './pages/admin/CashClose';
import { POSPage } from './pages/pos/POSPage';
import { KitchenPage } from './pages/kitchen/KitchenPage';

// Componente simple que decide a dónde ir.
// NO usa useEffect para evitar bucles. Usa renderizado condicional.
const RootRedirect: React.FC = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Redirección por rol
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'kitchen') return <Navigate to="/kitchen" replace />;
    
    // Default para cajeros/meseros
    return <Navigate to="/pos" replace />;
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />, 
        children: [
            { 
                index: true, 
                element: <RootRedirect /> 
            },
            {
                path: 'login',
                element: <LoginPage />
            },
            // --- ADMIN ---
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
            // --- POS ---
            {
                path: 'pos',
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'cashier', 'waiter']}>
                        <POSPage />
                    </ProtectedRoute>
                )
            },
            // --- KITCHEN ---
            {
                path: 'kitchen',
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'kitchen']}>
                        <KitchenPage />
                    </ProtectedRoute>
                )
            },
            {
                path: '*',
                element: <Navigate to="/" replace />
            }
        ]
    }
]);