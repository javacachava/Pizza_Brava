import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Pizza, 
  Users, 
  Layers, 
  DollarSign, 
  LogOut, 
  Utensils, 
  Settings 
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/products', icon: Pizza, label: 'Productos' },
    { to: '/admin/combos', icon: Utensils, label: 'Combos' },
    { to: '/admin/categories', icon: Layers, label: 'Categorías' },
    { to: '/admin/orders', icon: DollarSign, label: 'Cierre de Caja' },
    { to: '/admin/users', icon: Users, label: 'Usuarios' },
  ];

  // Items de configuración secundaria
  const configItems = [
    { to: '/admin/ingredients', label: 'Ingredientes' },
    { to: '/admin/flavors', label: 'Sabores' },
    { to: '/admin/sizes', label: 'Tamaños' },
    { to: '/admin/rules', label: 'Reglas Globales' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar Fijo */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-20 hidden md:flex flex-col shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">PB</div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Pizza Brava</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">Principal</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                  isActive
                    ? 'bg-orange-50 text-orange-700 font-semibold shadow-sm ring-1 ring-orange-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="my-4 border-t border-slate-100"></div>
          
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Settings size={12} /> Configuración Menú
          </p>
          {configItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg text-sm transition-colors ml-2 border-l-2 ${
                  isActive
                    ? 'border-orange-500 text-orange-700 bg-orange-50/50 font-medium'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs border border-orange-200">
              {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-700 truncate">{user?.name || 'Administrador'}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'admin'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all text-xs font-semibold shadow-sm"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};