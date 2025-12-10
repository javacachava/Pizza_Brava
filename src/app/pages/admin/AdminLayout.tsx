import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

export const AdminLayout: React.FC = () => {
    const { logout } = useAuth();
    const location = useLocation();

    const menuItems = [
        { path: '/admin', label: '📊 Dashboard' },
        { path: '/admin/orders', label: '💰 Cierre Caja' },
        { path: '/admin/categories', label: '📂 Categorías' },
        { path: '/admin/products', label: '🍕 Productos' },
        { path: '/admin/users', label: '👥 Usuarios' },
    ];

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f5' }}>
            <aside style={{ width: '250px', backgroundColor: '#1a202c', color: 'white', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '1px solid #2d3748' }}>
                    Admin Panel
                </div>
                <nav style={{ flex: 1, padding: '10px' }}>
                    {menuItems.map(item => (
                        <Link 
                            key={item.path} 
                            to={item.path}
                            style={{ 
                                display: 'block', 
                                padding: '12px 15px', 
                                color: location.pathname === item.path ? '#ff6b00' : '#a0aec0', 
                                textDecoration: 'none',
                                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.05)' : 'transparent',
                                borderRadius: '6px',
                                marginBottom: '5px',
                                fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                            }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div style={{ padding: '20px', borderTop: '1px solid #2d3748' }}>
                    <button onClick={() => logout()} style={{ background: 'none', border: 'none', color: '#fc8181', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🚪 Cerrar Sesión
                    </button>
                </div>
            </aside>
            <main style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                <Outlet />
            </main>
        </div>
    );
};