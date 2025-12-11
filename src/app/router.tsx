import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from './pages/admin/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

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

// Componente para redirección inteligente según rol
const RootRedirect: React.FC = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    
    // Redirección por rol
    switch (user.role) {
        case 'admin': return <Navigate to="/admin" replace />;
        case 'recepcion': return <Navigate to="/pos" replace />;
        case 'cocina': return <Navigate to="/kitchen" replace />;
        default: return <Navigate to="/login" replace />;
    }
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootRedirect />
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
            { path: 'combos', element: <CombosManager /> }, // 👈 Faltaba
            { path: 'orders', element: <CashClose /> },     // Cierre de caja
            { path: 'users', element: <UsersManager /> },
            
            // Sub-módulos de Configuración de Menú
            { path: 'ingredients', element: <IngredientsManager /> }, // 👈 Faltaba
            { path: 'flavors', element: <FlavorsManager /> },         // 👈 Faltaba
            { path: 'sizes', element: <SizesManager /> },             // 👈 Faltaba
            { path: 'rules', element: <RulesManager /> },             // 👈 Faltaba
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