import { useState, useMemo } from 'react';
import { useMenuContext } from '../../../contexts/MenuContext';
import { usePOSCommands } from '../../../hooks/usePOSCommands';
import type { MenuItem } from '../../../models/MenuItem';
import type { ProductUI, ProductBehavior } from '../../../models/ProductTypes';
import { ProductSelectionModal } from '../../components/modals/ProductSelectionModal';
import { CartSidebar } from './CartSidebar';
import { OrderTypeModal } from './OrderTypeModal';
import { useTables } from '../../../hooks/useTables';
import { ProductGrid } from './ProductGrid'; // [SOLID] Delegación de UI
import { CategoryTabs } from './CategoryTabs'; // Reutilizamos tu componente existente o la lógica de sidebar

// --- ICONOS (Simplificados y Profesionales) ---
const Icons = {
  All: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Pizza: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Drink: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  Combo: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Default: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
};

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('pizza')) return <Icons.Pizza />;
  if (n.includes('bebida') || n.includes('drink')) return <Icons.Drink />;
  if (n.includes('combo')) return <Icons.Combo />;
  return <Icons.Default />;
};

export const POSPage = () => {
  // 1. OBTENCIÓN DE DATOS (SOLID: Dependency Inversion vía Context)
  // [Fix]: Extraemos 'combos' que faltaba
  const { items, categories, combos, loading } = useMenuContext(); 
  
  const { commands, cart, isSubmitting } = usePOSCommands();
  const { tables } = useTables();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [productToConfig, setProductToConfig] = useState<ProductUI | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

  // 2. TRANSFORMACIÓN DE DATOS (Adapter Pattern implícito)
  const convertToProductUI = (item: MenuItem): ProductUI => {
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

  // 3. LÓGICA DE FILTRADO (Separada para productos y combos)
  const { filteredProducts, filteredCombos } = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const isAll = selectedCategoryId === 'all';

    // Filtramos Productos
    const fProducts = (items || []).filter(p => {
      const matchCat = isAll || p.categoryId === selectedCategoryId;
      const matchSearch = (p.name || '').toLowerCase().includes(term);
      return matchCat && matchSearch;
    });

    // Filtramos Combos
    // [Database Rules]: En bootstrap.json, los combos tienen categoryId: "combos"
    const fCombos = (combos || []).filter(c => {
      const matchCat = isAll || c.categoryId === selectedCategoryId; // O si el usuario selecciona específicamente "Combos"
      const matchSearch = (c.name || '').toLowerCase().includes(term);
      return matchCat && matchSearch;
    });

    return { filteredProducts: fProducts, filteredCombos: fCombos };
  }, [items, combos, selectedCategoryId, searchTerm]);

  // 4. HANDLERS
  const handleProductClick = (item: MenuItem) => {
    const uiProduct = convertToProductUI(item);
    if (uiProduct.behavior !== 'STANDARD') {
        setProductToConfig(uiProduct);
    } else {
        commands.addProductToCart(item);
    }
  };

  const handleComboClick = (combo: any) => {
      // Lógica para procesar combos (puede requerir su propio modal en el futuro)
      // Por ahora lo tratamos como producto simple si no tiene configuración compleja
      commands.addProductToCart({
          ...combo,
          price: combo.price, // Asegurar compatibilidad de tipos
          comboEligible: false // Ya es un combo
      } as MenuItem);
  };

  const handleConfigComplete = (finalItem: any