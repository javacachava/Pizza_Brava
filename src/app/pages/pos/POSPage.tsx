import React, { useState, useMemo } from 'react';
import { useMenu } from '../../../hooks/useMenu';
import { usePOSCommands } from '../../../hooks/usePOSCommands';
import { useTables } from '../../../hooks/useTables';

// Components UI
import { ProductGrid } from './ProductGrid';
import { CartSidebar } from './CartSidebar';
import { CategoryTabs } from './CategoryTabs';
// Modales (Named Imports)
import { ProductDetailModal } from './ProductDetailModal';
import { OrderTypeModal } from './OrderTypeModal';
import { ComboSelectionModal } from './ComboSelectionModal';

// Models
import type { MenuItem } from '../../../models/MenuItem';
import type { ComboDefinition } from '../../../models/ComboDefinition';
import type { OrderType } from '../../../models/Order';
import type { OrderItem } from '../../../models/OrderItem';

const POSPage: React.FC = () => {
  // --- 1. INFRAESTRUCTURA (Data Fetching) ---
  // Los hooks usan el container DI internamente.
  const { categories, products, combos, loading: menuLoading } = useMenu();
  const { tables } = useTables();
  
  // --- 2. APLICACIÓN (Lógica y Comandos) ---
  const { cart, commands, isSubmitting } = usePOSCommands();

  // --- 3. ESTADO UI (Solo visualización) ---
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado para controlar qué modal se muestra
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<ComboDefinition | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // --- Filtros UI ---
  const filteredProducts = useMemo(() => {
    let items = selectedCategory
      ? products.filter(p => p.categoryId === selectedCategory)
      : products;

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
    // Mostrar combos en 'Todos' o en categoría específica 'combos'
    if (!selectedCategory || selectedCategory === 'combos') {
        return combos;
    }
    return [];
  }, [selectedCategory, combos, searchQuery]);


  if (menuLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-500 animate-pulse">
          Cargando Sistema POS...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden font-sans">
      
      {/* SECCIÓN IZQUIERDA: CATÁLOGO */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative mr-80 transition-all">
        
        {/* Header: Buscador y Categorías */}
        <header className="bg-white px-6 py-4 shadow-sm z-10 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4 gap-4">
            <h1 className="text-2xl font-black text-gray-800 tracking-tight hidden lg:block">
              Pizza<span className="text-orange-600">Brava</span>
            </h1>
            
            <div className="relative flex-1 max-w-lg">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar producto..."
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-orange-500 rounded-xl focus:ring-4 focus:ring-orange-100 outline-none transition-all"
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
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <ProductGrid 
            products={filteredProducts}
            combos={filteredCombos}
            onProductClick={(prod: MenuItem) => {
              if (prod.usesIngredients || prod.usesFlavors || prod.usesSizeVariant) {
                // Producto complejo: Abrir Modal
                setSelectedProduct(prod);
              } else {
                // Producto simple: Acción Rápida
                commands.addProductToCart(prod);
              }
            }}
            onComboClick={(combo: ComboDefinition) => {
              setSelectedCombo(combo);
            }}
          />
        </main>
      </div>

      {/* SECCIÓN DERECHA: SIDEBAR (Fijo) */}
      <CartSidebar 
        cart={cart}
        onIncrease={commands.increaseQuantity}
        onDecrease={commands.decreaseQuantity}
        onRemove={commands.removeItem}
        onClear={commands.clearOrder}
        onProcess={() => setIsCheckoutOpen(true)}
      />

      {/* --- CAPA DE MODALES --- */}

      {/* 1. Modal Detalle Producto */}
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

      {/* 2. Modal Selección de Combo */}
      {selectedCombo && (
        <ComboSelectionModal
          combo={selectedCombo}
          isOpen={!!selectedCombo}
          onClose={() => setSelectedCombo(null)}
          onConfirm={(comboItem: OrderItem) => {
            commands.addComboToCart(comboItem);
            setSelectedCombo(null);
          }}
        />
      )}

      {/* 3. Modal Checkout (Tipo de Orden) */}
      <OrderTypeModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        isLoading={isSubmitting}
        tables={tables}
        onConfirm={async (type: OrderType, meta: any) => {
          await commands.submitOrder(type, meta);
          // Si el carrito se limpia (éxito), cerramos modal
          if (cart.length === 0) setIsCheckoutOpen(false);
        }}
      />
    </div>
  );
};

export default POSPage;