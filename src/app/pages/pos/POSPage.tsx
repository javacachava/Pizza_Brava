import React, { useState, useMemo } from 'react';
import { useMenu } from '../../../hooks/useMenu';
import { useAuth } from '../../../hooks/useAuth';
import { CategoryTabs } from './components/CategoryTabs';
import { ProductGrid } from './components/ProductGrid';
import { CartSidebar } from './components/CartSidebar';
import { ProductDetailModal } from './components/ProductDetailModal';
import type { MenuItem } from '../../../models/MenuItem';

export const POSPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { categories, isLoading } = useMenu();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

    const filteredProducts = useMemo(() => {
        let items: MenuItem[] = [];
        categories.forEach(cat => {
            const catItems = cat.items.filter(p => p.isAvailable);
            items.push(...catItems);
        });
        if (selectedCategoryId !== 'ALL') items = items.filter(p => p.categoryId === selectedCategoryId);
        if (searchQuery.trim()) items = items.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return items;
    }, [categories, selectedCategoryId, searchQuery]);

    if (isLoading) return <div className="h-screen flex items-center justify-center text-slate-400">Cargando Sistema...</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* IZQUIERDA: Catálogo */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-6 flex-1">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Punto de Venta</h2>
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
                                placeholder="Buscar producto..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-slate-700">{user?.name}</div>
                            <div className="text-xs text-slate-500 uppercase">{user?.role}</div>
                        </div>
                        <button onClick={logout} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Salir">
                            🚪
                        </button>
                    </div>
                </header>

                {/* Contenido Principal */}
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="px-6 pt-4 bg-white border-b border-slate-100">
                        <CategoryTabs categories={categories} selectedId={selectedCategoryId} onSelect={setSelectedCategoryId} />
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <span className="text-4xl mb-2">🍽️</span>
                                <p>No se encontraron productos</p>
                            </div>
                        ) : (
                            <ProductGrid products={filteredProducts} onProductClick={setSelectedProduct} />
                        )}
                    </div>
                </main>
            </div>

            {/* DERECHA: Carrito */}
            <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 backdrop-blur">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <span>🛒</span> Orden Actual
                    </h3>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <CartSidebar />
                </div>
            </aside>

            <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        </div>
    );
};