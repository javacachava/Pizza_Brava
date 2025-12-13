import { useState, useMemo } from 'react';
import { useMenuContext } from '../../../contexts/MenuContext';
import type { MenuItem } from '../../../models/MenuItem';
import type { ProductUI, ProductBehavior } from '../../../models/ProductTypes';
import { ProductSelectionModal } from '../../components/modals/ProductSelectionModal';
import { CartSidebar } from './CartSidebar';

// --- ICONOS SVG PROFESIONALES (Sin librerías externas) ---
const Icons = {
  All: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
  ),
  Pizza: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
  ),
  Drink: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
  ),
  Combo: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  ),
  Frozen: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  ),
  Default: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
  )
};

// Función helper para asignar iconos según el nombre de la categoría
const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('pizza')) return <Icons.Pizza />;
  if (n.includes('bebida') || n.includes('drink')) return <Icons.Drink />;
  if (n.includes('combo')) return <Icons.Combo />;
  if (n.includes('frozen')) return <Icons.Frozen />;
  return <Icons.Default />;
};

export const POSPage = () => {
  // 1. DATA REAL DIRECTA DEL CONTEXTO (Sin mocks)
  const { items, categories, loading } = useMenuContext();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [productToEdit, setProductToEdit] = useState<ProductUI | null>(null);

  // 2. TRANSFORMACIÓN DE DATOS (DB -> UI)
  const convertToProductUI = (item: MenuItem): ProductUI => {
    let behavior: ProductBehavior = 'STANDARD';
    
    // Determinación del comportamiento basada estrictamente en TUS campos de DB
    if (item.comboEligible) behavior = 'COMBO_PACK';
    else if (item.usesIngredients) behavior = 'CUSTOM_BUILDER';
    else if (item.usesFlavors) behavior = 'SIMPLE_VARIANT';

    return {
      ...item,
      behavior,
      // Inicializamos vacíos, se llenarán con la lógica de los otros contextos/hooks
      comboConfig: item.comboEligible ? { slots: [] } : undefined, 
      builderConfig: item.usesIngredients ? { ingredients: [] } : undefined,
      variantConfig: item.usesFlavors ? { groups: [] } : undefined,
    };
  };

  // 3. LÓGICA DE FILTRADO SEGURA
  const filteredProducts = useMemo(() => {
    if (!items) return [];

    return items.filter((product) => {
      // Normalización de IDs a String para evitar errores de tipo (number vs string)
      const pCatId = String(product.categoryId || '');
      const selCatId = String(selectedCategoryId);
      
      const matchesCategory = selectedCategoryId === 'all' || pCatId === selCatId;
      // Búsqueda segura (manejo de posibles nulls en nombre)
      const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategoryId, searchTerm]);

  const handleAddToCart = (finalItem: any) => {
    // Aquí conectarás con tu useOrders / CartService real
    console.log("Item al carrito:", finalItem);
  };

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
      
      {/* ==============================================================
          COLUMNA 1: SIDEBAR DE CATEGORÍAS (Estilo Kiosco Vertical)
      ============================================================== */}
      <nav className="w-[100px] md:w-[120px] flex flex-col items-center py-6 bg-[#161616] border-r border-[#2A2A2A] z-20 shadow-2xl h-full overflow-y-auto no-scrollbar">
        {/* Marca / Logo */}
        <div className="mb-8 p-3 rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#D84315] shadow-lg shadow-orange-900/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>

        <div className="flex flex-col gap-4 w-full px-3">
          {/* Botón 'Todo' */}
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`
              group flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-300 w-full aspect-square relative overflow-hidden
              ${selectedCategoryId === 'all' 
                ? 'bg-[#FF5722] text-white shadow-lg shadow-[#FF5722]/30 scale-100' 
                : 'bg-[#1E1E1E] text-gray-500 hover:bg-[#252525] hover:text-gray-200'}
            `}
          >
            <div className={`transition-transform duration-300 ${selectedCategoryId === 'all' ? 'scale-110' : 'group-hover:scale-110'}`}>
              <Icons.All />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">Todo</span>
            
            {selectedCategoryId === 'all' && (
              <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse"/>
            )}
          </button>

          {/* Categorías Dinámicas */}
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(String(cat.id))}
              className={`
                group flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-300 w-full aspect-square relative
                ${String(selectedCategoryId) === String(cat.id)
                  ? 'bg-[#FF5722] text-white shadow-lg shadow-[#FF5722]/30 scale-100' 
                  : 'bg-[#1E1E1E] text-gray-500 hover:bg-[#252525] hover:text-gray-200'}
              `}
            >
              <div className={`transition-transform duration-300 ${String(selectedCategoryId) === String(cat.id) ? 'scale-110' : 'group-hover:scale-110'}`}>
                {getCategoryIcon(