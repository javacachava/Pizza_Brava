import React, { useState, useMemo } from 'react';
import { useMenu } from '../../../hooks/useMenu';
import { usePOSCommands } from '../../../hooks/usePOSCommands';
import { useTables } from '../../../hooks/useTables';

// Components UI - CORREGIDOS IMPORTS (Named Exports)
import { ProductGrid } from './ProductGrid';
import { CartSidebar } from './CartSidebar';
import { CategoryTabs } from './CategoryTabs';
import { ProductDetailModal } from './ProductDetailModal';   // <--- Corregido
import { OrderTypeModal } from './OrderTypeModal';           // <--- Corregido
import { ComboSelectionModal } from './ComboSelectionModal'; // <--- Corregido

// Models
import type { MenuItem } from '../../../models/MenuItem';
import type { Combo } from '../../../models/Combo';
import type { OrderType } from '../../../models/Order'; // Importar tipos necesarios
import type { OrderItem } from '../../../models/OrderItem';

const POSPage: React.FC = () => {
  const { categories, products, combos, loading: menuLoading } = useMenu();
  const { tables } = useTables();
  const { cart, commands, isSubmitting } = usePOSCommands();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [isOrderTypeModalOpen, setIsOrderTypeModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let items = selectedCategory
      ? products.filter(p => p.categoryId === selectedCategory)
      : products;

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(lowerQ));
    }
    return items;
  }, [selectedCategory, products, searchQuery]);

  const filteredCombos = useMemo(() => {
    if (searchQuery) {
       const lowerQ = searchQuery.toLowerCase();
       return combos.filter(c => c.name.toLowerCase().includes(lowerQ));
    }
    if (!selectedCategory || selectedCategory === 'combos') {
        return combos;
    }
    return [];
  }, [selectedCategory, combos, searchQuery]);

  if (menuLoading) return <div className="p-10 text-center">Cargando menú...</div>;

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative mr-80">
        <header className="bg-white p-4 shadow-sm z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-800">Pizza Brava</h1>
            <input
              type="text"
              placeholder="Buscar..."
              className="px-4 py-2 border rounded-lg w-1/3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CategoryTabs 
            categories={categories}
            active={selectedCategory}
            onChange={setSelectedCategory}
          />
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <ProductGrid 
            products={filteredProducts}
            combos={filteredCombos}
            onProductClick={(prod: MenuItem) => { // <--- Tipado explícito
              if (prod.usesIngredients || prod.usesFlavors || prod.usesSizeVariant) {
                setSelectedProduct(prod);
              } else {
                commands.addProductToCart(prod);
              }
            }}
            onComboClick={(combo: Combo) => setSelectedCombo(combo)} // <--- Tipado explícito
          />
        </main>
      </div>

      <CartSidebar 
        cart={cart}
        onIncrease={commands.increaseQuantity}
        onDecrease={commands.decreaseQuantity}
        onRemove={commands.removeItem}
        onClear={commands.clearOrder}
        onProcess={() => setIsOrderTypeModalOpen(true)}
      />

      {/* Modales con Tipos Explícitos en Callbacks */}
      
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onConfirm={(productWithOpts: MenuItem) => { // <--- Tipado explícito
             commands.addProductToCart(productWithOpts); 
             setSelectedProduct(null);
          }}
        />
      )}

      {selectedCombo && (
        <ComboSelectionModal
          combo={selectedCombo}
          isOpen={!!selectedCombo}
          onClose={() => setSelectedCombo(null)}
          onConfirm={(comboItem: OrderItem) => { // <--- Tipado explícito
            commands.addComboToCart(comboItem);
            setSelectedCombo(null);
          }}
        />
      )}

      <OrderTypeModal 
        isOpen={isOrderTypeModalOpen}
        onClose={() => setIsOrderTypeModalOpen(false)}
        isLoading={isSubmitting}
        tables={tables}
        onConfirm={async (type: OrderType, meta: any) => { // <--- Tipado explícito (OrderType)
          await commands.submitOrder(type, meta);
          if (cart.length === 0) setIsOrderTypeModalOpen(false); 
        }}
      />
    </div>
  );
};

export default POSPage;