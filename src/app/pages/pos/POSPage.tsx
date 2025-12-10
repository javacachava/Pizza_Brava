import React, { useState, useMemo } from 'react';
import { useMenu } from '../../../hooks/useMenu';
import { usePOS } from '../../../hooks/usePOS';
import { CategoryTabs } from './components/CategoryTabs';
import { ProductGrid } from './components/ProductGrid';
import { CartSidebar } from './components/CartSidebar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ComboSelectionModal } from './components/ComboSelectionModal';
import type { MenuItem } from '../../../models/MenuItem';

export const POSPage: React.FC = () => {
    const { categories, isLoading } = useMenu();
    
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
    const [showComboModal, setShowComboModal] = useState(false);

    const filteredProducts = useMemo(() => {
        let items: MenuItem[] = [];
        
        categories.forEach(cat => items.push(...cat.items));
        if (selectedCategoryId !== 'ALL') {
            items = items.filter(p => p.categoryId === selectedCategoryId);
        }

        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            items = items.filter(p => p.name.toLowerCase().includes(lowerQ));
        }

        return items;
    }, [categories, selectedCategoryId, searchQuery]);

    const handleProductClick = (product: MenuItem) => {
        if (product.comboEligible && product.categoryId === 'combos') {
            setShowComboModal(true);
        } else {
            setSelectedProduct(product);
        }
    };

    if (isLoading) return <div style={{ padding: '20px' }}>Cargando menú...</div>;

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f7fafc' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar producto..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem' }}
                    />
                </div>

                <div style={{ padding: '0 15px', backgroundColor: 'white' }}>
                    <CategoryTabs 
                        categories={categories} 
                        selectedId={selectedCategoryId} 
                        onSelect={setSelectedCategoryId} 
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                    <ProductGrid products={filteredProducts} onProductClick={handleProductClick} />
                </div>
            </div>
            <div style={{ width: '350px', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fffaf0' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#ed8936' }}>Orden Actual</h2>
                </div>
                <div style={{ flex: 1, padding: '15px', overflow: 'hidden' }}>
                    <CartSidebar />
                </div>
            </div>

            <ProductDetailModal 
                product={selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
            />
            
            <ComboSelectionModal 
                isOpen={showComboModal} 
                onClose={() => setShowComboModal(false)} 
            />
        </div>
    );
};