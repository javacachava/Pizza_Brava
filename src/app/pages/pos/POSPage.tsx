import { useState, useMemo } from 'react';
import { useMenuContext } from '../../../contexts/MenuContext';
import { usePOSCommands } from '../../../hooks/usePOSCommands';
import { useTables } from '../../../hooks/useTables';

// Modelos
import type { MenuItem } from '../../../models/MenuItem';
import type { ProductUI, ProductBehavior, ComboOption, ComboSlot as UIComboSlot } from '../../../models/ProductTypes';
import type { ComboDefinition, ComboSlot as DBComboSlot } from '../../../models/ComboDefinition';

// Componentes
import { ProductSelectionModal } from '../../components/modals/ProductSelectionModal';
import { CartSidebar } from './CartSidebar';
import { OrderTypeModal } from './OrderTypeModal';
import { ProductGrid } from './ProductGrid';

// --- ICONOS SVG ---
const Icons = {
  All: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
  ),
  Combo: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  ),
  Pizza: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Drink: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  Frozen: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Default: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
};

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('pizza')) return <Icons.Pizza />;
  if (n.includes('bebida') || n.includes('drink')) return <Icons.Drink />;
  if (n.includes('combo')) return <Icons.Combo />;
  if (n.includes('frozen') || n.includes('helado')) return <Icons.Frozen />;
  return <Icons.Default />;
};

// --- SUB-COMPONENTE LOCAL: Botón de Categoría ---
interface CategoryButtonProps {
  id: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ isActive, onClick, icon, name }) => (
  <button
    onClick={onClick}
    className={`
      group flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-300 w-full aspect-square relative overflow-hidden
      ${isActive 
        ? 'bg-[#FF5722] text-white shadow-lg shadow-[#FF5722]/30 scale-100' 
        : 'bg-[#1E1E1E] text-gray-500 hover:bg-[#252525] hover:text-gray-200'}
    `}
  >
    <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">{name}</span>
  </button>
);

export const POSPage = () => {
  // 1. OBTENCIÓN DE DATOS
  const { items, categories, combos, loading } = useMenuContext(); 
  const { commands, cart, isSubmitting } = usePOSCommands();
  const { tables } = useTables();
  
  // Estados Locales
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [productToConfig, setProductToConfig] = useState<ProductUI | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

  // 2. ADAPTADORES DE DATOS
  
  const convertProductToUI = (item: MenuItem): ProductUI => {
    let behavior: ProductBehavior = 'STANDARD';
    if (item.comboEligible) behavior = 'COMBO_PACK';
    else if (item.usesIngredients) behavior = 'CUSTOM_BUILDER';
    else if (item.usesFlavors) behavior = 'SIMPLE_VARIANT';

    return {
      ...item,
      behavior,
      comboConfig: item.comboEligible ? { slots: [] } : undefined, 
      builderConfig: item.usesIngredients ? { ingredients: [] } : undefined,
      variantConfig: item.usesFlavors ? { groups: [] } : undefined,
    };
  };

  const convertComboToUI = (combo: ComboDefinition): ProductUI => {
    // Mapeo manual de slots de DB a UI
    const uiSlots: UIComboSlot[] = (combo.slots || []).map(dbSlot => ({
        id: dbSlot.id,
        title: dbSlot.name, // Mapping 'name' to 'title'
        isRequired: !!dbSlot.required, // Ensure boolean
        isSwappable: true, // Asumimos true por defecto o lógica de negocio
        defaultOptionId: '', // Necesita lógica real si existe en DB
        options: [] // TODO: Necesitamos poblar las opciones reales basadas en allowedProductIds
    }));

    // NOTA: Para que el selector funcione, necesitamos hidratar las opciones.
    // Como 'Combos' en la DB solo tienen IDs, aquí necesitaríamos cruzar con 'items' (menuItems).
    // Por simplicidad en este paso, lo mapeamos básico. El hook useProductSelection deberá manejar el cruce real si fuera necesario, 
    // pero idealmente 'ComboDefinition' ya debería traer datos enriquecidos o hacerlo aquí.
    
    // Enriquecimiento básico de slots con productos reales (CRÍTICO para que funcione el UI)
    const hydratedSlots = uiSlots.map(slot => {
        const dbSlot = combo.slots?.find(s => s.id === slot.id);
        if (!dbSlot) return slot;

        // Buscamos los productos permitidos en el menú global
        const validOptions: ComboOption[] = (items || [])
            .filter(item => dbSlot.allowedProductIds.includes(item.id))
            .map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.imageUrl || undefined
            }));

        return {
            ...slot,
            options: validOptions,
            defaultOptionId: validOptions[0]?.id || ''
        };
    });

    return {
      id: combo.id,
      name: combo.name,
      price: combo.price,
      categoryId: 'combos',
      description: combo.description,
      behavior: 'COMBO_PACK',
      isActive: true,
      comboConfig: { slots: hydratedSlots },
      usesIngredients: false,
      usesFlavors: false,
      comboEligible: true, 
      isAlcoholic: false
    } as ProductUI;
  };

  // 3. LÓGICA DE FILTRADO
  const { filteredProducts, filteredCombos } = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const isAll = selectedCategoryId === 'all';
    const isComboCat = selectedCategoryId === 'combos';

    const fProducts = (items || []).filter(p => {
      if (isComboCat) return false;
      const matchCat = isAll || p.categoryId === selectedCategoryId;
      const matchSearch = (p.name || '').toLowerCase().includes(term);
      return matchCat && matchSearch;
    });

    const fCombos = (combos || []).filter(c => {
      const matchCat = isAll || isComboCat;
      const matchSearch = (c.name || '').toLowerCase().includes(term);
      return matchCat && matchSearch;
    });

    return { filteredProducts: fProducts, filteredCombos: fCombos };
  }, [items, combos, selectedCategoryId, searchTerm]);

  // 4. HANDLERS
  const handleProductClick = (item: MenuItem) => {
    const uiProduct = convertProductToUI(item);
    if (uiProduct.behavior !== 'STANDARD') {
        setProductToConfig(uiProduct);
    } else {
        commands.addProductToCart(item);
    }
  };

  const handleComboClick = (combo: ComboDefinition) => {
      const uiCombo = convertComboToUI(combo);
      setProductToConfig(uiCombo);
  };

  const handleConfigComplete = (finalItem: { product: ProductUI, finalPrice: number, modifiers: any }) => {
    const cartItem = {
      ...finalItem.product,
      price: finalItem.finalPrice,
      // Aquí se podrían adjuntar los modificadores al objeto del carrito para que cocina los vea
      // pending: cartService update to support modifiers structure
    };
    commands.addProductToCart(cartItem, 1, "Configuración Personalizada"); 
  };

  // 5. RENDERIZADO
  if (loading) {
    return (
      <div className="h-screen w-full bg-[#121212] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#FF5722] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium animate-pulse">Cargando Menú...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0F0F0F] text-gray-100 overflow-hidden font-sans selection:bg-[#FF5722] selection:text-white">
      
      {/* COL 1: SIDEBAR CATEGORÍAS */}
      <nav className="w-[100px] md:w-[120px] flex flex-col items-center py-6 bg-[#161616] border-r border-[#2A2A2A] z-20 shadow-2xl h-full overflow-y-auto no-scrollbar scrollbar-hide">
        <div className="mb-8 p-3 rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#D84315] shadow-lg shadow-orange-900/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>

        <div className="flex flex-col gap-4 w-full px-3 pb-6">
          <CategoryButton 
            id="all" 
            name="Todo" 
            isActive={selectedCategoryId === 'all'} 
            onClick={() => setSelectedCategoryId('all')} 
            icon={<Icons.All />} 
          />
          <CategoryButton 
            id="combos" 
            name="Combos" 
            isActive={selectedCategoryId === 'combos'} 
            onClick={() => setSelectedCategoryId('combos')} 
            icon={<Icons.Combo />} 
          />
          {categories?.map((cat) => (
            <CategoryButton 
              key={cat.id}
              id={String(cat.id)}
              name={cat.name}
              isActive={String(selectedCategoryId) === String(cat.id)}
              onClick={() => setSelectedCategoryId(String(cat.id))}
              icon={getCategoryIcon(cat.name)}
            />
          ))}
        </div>
      </nav>

      {/* COL 2: GRID DE PRODUCTOS */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="h-20 border-b border-[#2A2A2A] bg-[#161616]/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Menú Principal</h1>
            <p className="text-sm text-gray-500">Selecciona productos para la orden</p>
          </div>
          <div className="relative">
            <input 
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 bg-[#0F0F0F] border border-[#333] rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-300 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition-all"
            />
            <svg className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
            <ProductGrid 
              products={filteredProducts}
              combos={filteredCombos}
              onProductClick={handleProductClick}
              onComboClick={handleComboClick}
            />
        </div>
      </main>

      {/* COL 3: CART SIDEBAR */}
      <CartSidebar 
        cart={cart}
        onIncrease={commands.increaseQuantity}
        onDecrease={commands.decreaseQuantity}
        onClear={commands.clearOrder}
        onProcess={() => setIsProcessModalOpen(true)}
        onRemove={commands.removeItem}
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
          commands.submitOrder(type, meta).then(() => {
             if(cart.length === 0) setIsProcessModalOpen(false);
          });
        }}
      />
    </div>
  );
};

export default POSPage;