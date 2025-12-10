import React, { useEffect } from 'react';
import { createBrowserRouter, useNavigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { AdminLayout } from './pages/admin/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// Pages
import { LoginPage } from '../app/components/auth/LoginPage';
import { Dashboard } from './pages/admin/Dashboard';
import { ProductsManager } from './pages/admin/ProductsManager';
import { CategoriesManager } from './pages/admin/CategoriesManager';
import { UsersManager } from './pages/admin/UsersManager'; 
import { CashClose } from './pages/admin/CashClose';
import { POSPage } from './pages/pos/POSPage';
import { KitchenPage } from './pages/kitchen/KitchenPage';

const RootDispatcher: React.FC = () => {
    const { user, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated && user) {
                if (user.role === 'admin') navigate('/admin');
                else if (user.role === 'kitchen') navigate('/kitchen');
                else navigate('/pos');
            }
        }
    }, [user, isAuthenticated, loading, navigate]);

    if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
    return <LoginPage />; 
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />, 
        children: [
            { index: true, element: <RootDispatcher /> },
            { path: 'login', element: <LoginPage /> },
            {
                path: 'admin',
                element: <ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>,
                children: [
                    { path: '', element: <Dashboard /> },
                    { path: 'products', element: <ProductsManager /> },
                    { path: 'categories', element: <CategoriesManager /> },
                    { path: 'users', element: <UsersManager /> }, 
                    { path: 'orders', element: <CashClose /> }
                ]
            },
            {
                path: 'pos',
                element: <ProtectedRoute allowedRoles={['admin', 'cashier', 'waiter']}><POSPage /></ProtectedRoute>
            },
            {
                path: 'kitchen',
                element: <ProtectedRoute allowedRoles={['admin', 'kitchen']}><KitchenPage /></ProtectedRoute>
            }
        ]
    }
]);