import React, { useState, useMemo } from 'react';
import { useMenu } from '../../../hooks/useMenu';
import { usePOSCommands } from '../../../hooks/usePOSCommands';
import { useTables } from '../../../hooks/useTables';

import { ProductGrid } from './ProductGrid';
import { CartSidebar } from './CartSidebar';
import { CategoryTabs } from './CategoryTabs';
import { ProductDetailModal } from './ProductDetailModal';
import { OrderTypeModal } from './OrderTypeModal';
import { ComboSelectionModal } from './ComboSelectionModal';

import type { MenuItem } from '../../../models/MenuItem';
import type { ComboDefinition } from '../../../models/ComboDefinition';
import type { OrderType } from '../../../models/Order';

export const POSPage: React.FC = () => {
  const { categories, products, combos, loading: menuLoading } = useMenu();
  const { tables } = useTables();
  const { cart, commands, isSubmitting } = usePOSCommands();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<ComboDefinition | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // --- Filtros ---
  const filteredProducts = useMemo(() => {
    let items = selectedCategory
      ? products.filter(p => p.categoryId === selectedCategory)
      : products; // En "Todos", mostramos productos

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q));
    }
    return items;
  }, [selectedCategory, products, searchQuery]);

  const filteredCombos = useMemo(() => {
    if (searchQuery) {
       const q = searchQuery.toLowerCase();
       return combos.filter(c => c.name.toLowerCase().includes(q));
    }
    // En "Todos" o categoría "combos", mostramos combos
    if (!selectedCategory || selectedCategory === 'combos') {
        return combos;
    }
    return [];
  }, [selectedCategory, combos, searchQuery]);

  if (menuLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-bold text-orange-500 animate-pulse">Cargando Menú...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden font-sans">
      
      {/* SECCIÓN CATÁLOGO */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative mr-80">
        
        {/* Header */}
        <header className="bg-white px-6 py-4 shadow-sm z-10 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4 gap-4">
            <h1 className="text-2xl font-black text-gray-800 hidden lg:block">
              Pizza<span className="text-orange-600">Brava</span>
            </h1>
            <div className="relative flex-1 max-w-lg">
              <input
                type="text"
                placeholder="🔍 Buscar..."
                className="w-full px-4 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <CategoryTabs 
            categories={categories}
            active={selectedCategory}
            onChange={setSelectedCategory}
          />
        </header>

        {/* Grid de Productos */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <ProductGrid 
            products={filteredProducts}
            combos={filteredCombos}
            onProductClick={(prod) => {
              if (prod.usesIngredients || prod.usesFlavors || prod.usesSizeVariant) {
                setSelectedProduct(prod);
              } else {
                commands.addProductToCart(prod);
              }
            }}
            onComboClick={setSelectedCombo}
          />
        </main>
      </div>

      {/* SIDEBAR */}
      <CartSidebar 
        cart={cart}
        onIncrease={commands.increaseQuantity}
        onDecrease={commands.decreaseQuantity}
        onRemove={commands.removeItem}
        onClear={commands.clearOrder}
        onProcess={() => setIsCheckoutOpen(true)}
      />

      {/* --- MODALES --- */}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onConfirm={(product, qty, notes) => {
             commands.addProductToCart(product, qty, notes);
             setSelectedProduct(null);
          }}
        />
      )}

      {selectedCombo && (
        <ComboSelectionModal
          combo={selectedCombo}
          isOpen={!!selectedCombo}
          onClose={() => setSelectedCombo(null)}
          onConfirm={(comboItem) => {
            commands.addComboToCart(comboItem);
            setSelectedCombo(null);
          }}
          products={products} // <--- Pasamos el menú completo para poblar los selectores
        />
      )}

      <OrderTypeModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        isLoading={isSubmitting}
        tables={tables}
        onConfirm={async (type, meta) => {
          await commands.submitOrder(type, meta);
          if (cart.length === 0) setIsCheckoutOpen(false);
        }}
      />
    </div>
  );
};