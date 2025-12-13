import { useState, useMemo } from 'react';
import { useMenuContext } from '../../../contexts/MenuContext';
import type { MenuItem } from '../../../models/MenuItem';
import type { ProductUI, ProductBehavior } from '../../../models/ProductTypes';
import { ProductSelectionModal } from '../../components/modals/ProductSelectionModal';
import { CartSidebar } from './CartSidebar'; 

export const POSPage = () => {
  // 1. OBTENER DATOS REALES (Sin inventar nada)
  const { items, categories, loading } = useMenuContext();
  
  // Estado local
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [productToEdit, setProductToEdit] = useState<ProductUI | null>(null);

  // 2. CONVERTIR DATOS (Tu lógica de negocio intacta)
  const convertToProductUI = (item: MenuItem): ProductUI => {
    let behavior: ProductBehavior = 'STANDARD';
    if (item.comboEligible) behavior = 'COMBO_PACK';
    else if (item.usesIngredients) behavior = 'CUSTOM_BUILDER';
    else if (item.usesFlavors) behavior = 'SIMPLE_VARIANT';

    return {
      ...item,
      behavior,
      comboConfig: item.comboEligible ? { slots: [] } : undefined, // Se llenará con tus datos reales
      builderConfig: item.usesIngredients ? { ingredients: [] } : undefined,
      variantConfig: item.usesFlavors ? { groups: [] } : undefined,
    };
  };

  // 3. FILTRADO SEGURO (Para que no explote si algo viene null)
  const filteredProducts = useMemo(() => {
    if (!items) return []; // Si no ha cargado, devuelve vacío pero no rompe

    return items.filter((product) => {
      // Comparación segura de IDs (String vs String)
      const pCatId = String(product.categoryId || '');
      const selCatId = String(selectedCategoryId);
      
      const matchesCategory = selectedCategoryId === 'all' || pCatId === selCatId;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategoryId, searchTerm]);

  // Manejadores
  const handleProductClick = (item: MenuItem) => {
    setProductToEdit(convertToProductUI(item));
  };

  const handleAddToCart = (finalItem: any) => {
    // Aquí tu lógica existente para agregar al carrito
    console.log("Agregar al carrito:", finalItem);
  };

  if (loading) {
    return <div className="h-screen bg-[#121212] flex items-center justify-center text-white">Cargando productos...</div>;
  }

  return (
    <div className="flex h-screen w-screen bg-[#121212] overflow-hidden text-white font-sans">
      
      {/* =======================================================
          COLUMNA 1: BARRA LATERAL DE CATEGORÍAS (Estilo Kiosco)
      ======================================================= */}
      <nav className="w-24 md:w-32 flex flex-col items-center py-6 bg-[#1A1A1A] border-r border-[#333] z-20 shadow-xl overflow-y-auto no-scrollbar">
        {/* Logo o Icono Principal */}
        <div className="mb-8 p-2 rounded-full bg-[#FF5722]/10">
          <span className="text-3xl">🍕</span>
        </div>

        <div className="flex flex-col gap-4 w-full px-2">
          {/* Botón TODO */}
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-200 w-full aspect-square ${
              selectedCategoryId === 'all' 
                ? 'bg-[#FF5722] text-white shadow-lg shadow-[#FF5722]/40 scale-105' 
                : 'bg-[#252525] text-gray-400 hover:bg-[#333] hover:text-white'
            }`}
          >
            <span className="text-2xl">🍽️</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Todo</span>
          </button>

          {/* Categorías Reales de la BD */}
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(String(cat.id))}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-200 w-full aspect-square ${
                String(selectedCategoryId) === String(cat.id)
                  ? 'bg-[#FF5722] text-white shadow-lg shadow-[#FF5722]/40 scale-105' 
                  : 'bg-[#252525] text-gray-400 hover:bg-[#333] hover:text-white'
              }`}
            >
              {/* Aquí podrías mapear iconos según el nombre, por ahora uso uno genérico si no hay */}
              <span className="text-2xl">
                 {cat.name.toLowerCase().includes('pizza') ? '🍕' : 
                  cat.name.toLowerCase().includes('bebida') ? '🥤' : 
                  cat.name.toLowerCase().includes('combo') ? '📦' : '🍔'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* =======================================================
          COLUMNA 2: ÁREA PRINCIPAL (Productos)
      ======================================================= */}
      <main className="flex-1 flex flex-col h-full bg-[#121212] relative">
        
        {/* Header: Buscador */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-[#333] bg-[#121212]/95 backdrop-blur z-10">
          <div className="relative w-full max-w-xl">
             <input 
                type="text" 
                placeholder="Buscar en el menú..." 
                className="w-full h-12 pl-12 pr-4 rounded-full bg-[#252525] border border-transparent focus:border-[#FF5722] focus:bg-[#1E1E1E] text-white placeholder-gray-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
             <span className="absolute left-4 top-3.5 text-gray-500">🔍</span>
          </div>
          
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-200">
               {selectedCategoryId === 'all' 
                 ? 'Menú Completo' 
                 : categories?.find(c => String(c.id) === selectedCategoryId)?.name || 'Menú'}
            </h1>
          </div>
        </header>

        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group relative bg-[#1E1E1E] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#FF5722]/10 transition-all duration-300 hover:-translate-y-1 border border-[#333] hover:border-[#FF5722]"
              >
                {/* Imagen (Ocupa 60% de la tarjeta) */}
                <div className="h-48 w-full bg-gray-800 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🍕</div>
                  )}
                  {/* Gradiente para texto legible */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] via-transparent to-transparent opacity-90" />
                </div>

                {/* Info del Producto */}
                <div className="p-5 relative -mt-6">
                  <h3 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-2 group-hover:text-[#FF5722] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">
                    {product.description || ''}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-white">
                      ${product.price.toFixed(2)}
                    </span>
                    <button className="w-10 h-10 rounded-full bg-[#333] group-hover:bg-[#FF5722] flex items-center justify-center text-white shadow-lg transition-colors">
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center text-gray-500 mt-20">
                <span className="text-6xl mb-4">😕</span>
                <p className="text-xl">No encontramos productos aquí.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* =======================================================
          COLUMNA 3: CARRITO (Fijo a la derecha)
      ======================================================= */}
      <aside className="w-[350px] xl:w-[400px] bg-[#1a1a1a] border-l border-[#333] flex flex-col shadow-2xl z-30">
        <CartSidebar cart={[]} onIncrease={function (index: number): void {
          throw new Error('Function not implemented.');
        } } onDecrease={function (index: number): void {
          throw new Error('Function not implemented.');
        } } onRemove={function (index: number): void {
          throw new Error('Function not implemented.');
        } } onClear={function (): void {
          throw new Error('Function not implemented.');
        } } onProcess={function (): void {
          throw new Error('Function not implemented.');
        } } />
      </aside>

      {/* MODAL */}
      <ProductSelectionModal 
        isOpen={!!productToEdit} 
        onClose={() => setProductToEdit(null)} 
        product={productToEdit}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};