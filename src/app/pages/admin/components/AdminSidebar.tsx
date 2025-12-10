import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const menuItems = [
    { path: '/admin', label: '📊 Dashboard' },
    { path: '/admin/orders', label: '💰 Cierre Caja' },
    { path: '/admin/categories', label: '📂 Categorías' },
    { path: '/admin/products', label: '🍕 Productos' },
    { path: '/admin/combos', label: '🎛️ Combos' },
    { path: '/admin/flavors', label: '🍦 Sabores' },
    { path: '/admin/sizes', label: '📐 Tamaños' },
    { path: '/admin/ingredients', label: '🧂 Ingredientes' },
    { path: '/admin/accompaniments', label: '🍟 Acompañamientos' },
    { path: '/admin/users', label: '👥 Usuarios' },
    { path: '/admin/rules', label: '⚙️ Reglas' }
  ];

  return (
    <aside style={{ width: 240, backgroundColor: '#1a202c', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 20, fontWeight: 'bold', borderBottom: '1px solid #2d3748' }}>Admin Panel</div>
      <nav style={{ padding: 10, flex: 1 }}>
        {menuItems.map(item => (
          <Link key={item.path} to={item.path} style={{
            display: 'block',
            padding: '10px 12px',
            color: location.pathname === item.path ? '#ff6b00' : '#a0aec0',
            textDecoration: 'none',
            borderRadius: 6,
            marginBottom: 6,
            backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.03)' : 'transparent'
          }}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
