import { useState, useMemo } from 'react';
import { useMenuContext } from '../../../contexts/MenuContext';
import { usePOSCommands } from '../../../hooks/usePOSCommands';
import { useTables } from '../../../hooks/useTables';

// Modelos
import type { MenuItem } from '../../../models/MenuItem';
import type { ComboDefinition } from '../../../models/ComboDefinition';
import type { ProductUI, ProductBehavior } from '../../../models/ProductTypes';

// Utils
import { CategoryThemeFactory } from '../../../utils/CategoryThemeFactory';

// Componentes
import { ProductSelectionModal } from '../../components/modals/ProductSelectionModal';
import { CartSidebar } from './CartSidebar';
import { OrderTypeModal } from './OrderTypeModal';
import { ProductGrid } from './ProductGrid';

/* =========================
   Category Button (SIN CAMBIOS VISUALES)
========================= */
const CategoryButton = ({ id, name, isActive, onClick }: { id: string; name: string; isActive: boolean; onClick: () => void }) => {
  const theme = CategoryThemeFactory.getTheme(name || id);
  const IconComponent = theme.icon;

  return (
    <button
      onClick={onClick}
      className={`
        group flex flex-col items-center justify-center gap-1 md:gap-2 p-2 rounded-2xl
        transition-all duration-300 w-full aspect-square relative
        ${isActive
          ? `bg-gradient-to-br ${theme.gradient} text-white shadow-lg scale-100 ring-2 ring-offset-2 ring-offset-[#161616] ring-transparent`
          : 'bg-[#1E1E1E] text-gray-500 hover:bg-[#252525] hover:text-gray-200'}
      `}
    >
      <div className={`text-xl md:text-2xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        {IconComponent && <IconComponent size={24} />}
      </div>
      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-center leading-tight truncate w-full px-1">
        {name}
      </span>
    </button>
  );
};

export const POSPage = () => {
  const { items, categories, combos, loading } = useMenuContext();
  const { commands, cart, isSubmitting } = usePOSCommands();
  const { tables } = useTables();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [productToConfig, setProductToConfig] = useState<ProductUI | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

  /* =========================
     ADAPTADORES (SIN CAMBIOS DE UI)
  ========================= */

  const convertProductToUI = (item: MenuItem): ProductUI => {
    let behavior: ProductBehavior = 'STANDARD';

    if (item.usesIngredients) behavior = 'CUSTOM_BUILDER';
    else if (item.usesFlavors) behavior = 'SIMPLE_VARIANT';

    return {
      ...item,
      behavior,
      comboConfig: undefined,
      builderConfig: item.usesIngredients ? { ingredients: [] } : undefined,
      variantConfig: item.usesFlavors ? { groups: [] } : undefined,
    };
  };

  const convertComboToUI = (combo: ComboDefinition): ProductUI => {
    // 1. Mapeo inicial de slots
    const rawSlots = combo.slots || [];
    
    // 2. Hidratación de slots con productos reales
    const hydratedSlots: any[] = rawSlots.map(dbSlot => {
        const validOptions: any[] = (items || [])
            .filter(item => dbSlot.allowedProductIds.includes(item.id))
            .map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.imageUrl || undefined
            }));
            
        return {
            id: dbSlot.id,
            title: dbSlot.name,
            isRequired: dbSlot.required === true || dbSlot.required === 'required',
            isSwappable: true,
            options: validOptions,
            defaultOptionId: validOptions[0]?.id || ''
        };
    });

    return {
      id: combo.id,
      name: combo.name,
      description: combo.description,
      price: combo.price,
      categoryId: 'combos',
      behavior: 'COMBO_PACK',
      isAvailable: combo.isAvailable,
      comboConfig: { slots: hydratedSlots },
      usesIngredients: false,
      usesFlavors: false,
    } as ProductUI;
  };

  /* =========================
     🔒 FILTRADO BLINDADO (CAMBIO REAL)
  ========================= */

  const { filteredProducts, filteredCombos } = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const isAll = selectedCategoryId === 'all';
    const isCombos = selectedCategoryId === 'combos';

    // ⛔ PRODUCTOS NUNCA EN COMBOS
    const fProducts = (items || []).filter(p => {
      if (isCombos) return false;
      if (!isAll && p.categoryId !== selectedCategoryId) return false;
      return p.name.toLowerCase().includes(term);
    });

    // ⛔ SOLO COMBOS REALES
    const fCombos = (combos || []).filter(c => {
      if (!isAll && !isCombos) return false;
      return c.name.toLowerCase().includes(term);
    });

    return { filteredProducts: fProducts, filteredCombos: fCombos };
  }, [items, combos, selectedCategoryId, searchTerm]);

  /* =========================
     HANDLERS
  ========================= */

  const handleProductClick = (item: MenuItem) => {
    const ui = convertProductToUI(item);
    if (ui.behavior !== 'STANDARD') setProductToConfig(ui);
    else commands.addProductToCart(item);
  };

  const handleComboClick = (combo: ComboDefinition) => {
    setProductToConfig(convertComboToUI(combo));
  };

  const handleConfigComplete = (finalItem: { product: ProductUI; finalPrice: number }) => {
    commands.addProductToCart(
      { ...finalItem.product, price: finalItem.finalPrice },
      1,
      'Configuración'
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#121212] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#FF5722] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* =========================
     RENDER (100% IGUAL)
  ========================= */

  return (
    <div className="flex h-screen w-full bg-[#0F0F0F] text-gray-100 overflow-hidden font-sans">

      {/* SIDEBAR */}
      <nav className="w-[85px] md:w-[90px] lg:w-[110px] flex-shrink-0 flex flex-col items-center py-4 bg-[#161616] border-r border-[#2A2A2A]">
        <div className="flex flex-col gap-4 w-full px-2">
          <CategoryButton id="all" name="Todo" isActive={selectedCategoryId === 'all'} onClick={() => setSelectedCategoryId('all')} />
          <CategoryButton id="combos" name="Combos" isActive={selectedCategoryId === 'combos'} onClick={() => setSelectedCategoryId('combos')} />
          {categories.map(cat => (
            <CategoryButton
              key={cat.id}
              id={cat.id}
              name={cat.name}
              isActive={selectedCategoryId === cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
            />
          ))}
        </div>
      </nav>

      {/* GRID */}
      <main className="flex-1 overflow-y-auto p-6">
        <ProductGrid
          products={filteredProducts}
          combos={filteredCombos}
          onProductClick={handleProductClick}
          onComboClick={handleComboClick}
        />
      </main>

      {/* CART */}
      <CartSidebar
        cart={cart}
        onIncrease={commands.increaseQuantity}
        onDecrease={commands.decreaseQuantity}
        onRemove={commands.removeItem}
        onClear={commands.clearOrder}
        onProcess={() => setIsProcessModalOpen(true)}
      />

      {/* MODALES */}
      <ProductSelectionModal
        isOpen={!!productToConfig}
        product={productToConfig}
        onClose={() => setProductToConfig(null)}
        onAddToCart={handleConfigComplete}
      />

      <OrderTypeModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        isLoading={isSubmitting}
        tables={tables}
        onConfirm={(type, meta) => {
            const domainType = type === 'comer_aqui' ? 'mesa' : type;
            commands.submitOrder(domainType, meta);
        }}
      />
    </div>
  );
};

export default POSPage;
