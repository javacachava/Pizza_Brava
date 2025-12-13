import { useState, useMemo } from 'react';
import { useMenuContext } from '../../../contexts/MenuContext';
import type { ProductUI, ProductBehavior } from '../../../models/ProductTypes';
import type { MenuItem } from '../../../models/MenuItem';
import { ProductSelectionModal } from '../../components/modals/ProductSelectionModal';
import { CartSidebar } from './CartSidebar'; 

// --- 1. DATOS DE PRUEBA (Para que siempre veas algo) ---
const MOCK_CATEGORIES = [
  { id: 'combos', name: 'Combos' },
  { id: 'pizzas', name: 'Pizzas' },
  { id: 'bebidas', name: 'Bebidas' },
  { id: 'frozen', name: 'Frozen' }
];

const MOCK_PRODUCTS: MenuItem[] = [
  { 
    id: 'mock-1', name: 'Combo Familiar', price: 25.00, categoryId: 'combos', 
    comboEligible: true, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80',
    description: 'Pizza Gigante + 4 Bebidas + Papas'
  },
  { 
    id: 'mock-2', name: 'Pizza Pepperoni', price: 12.00, categoryId: 'pizzas', 
    usesIngredients: true, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80',
    description: 'Clásica con doble pepperoni'
  },
  { 
    id: 'mock-3', name: 'Frozen Mango', price: 3.50, categoryId: 'frozen', 
    usesFlavors: true, imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=500&q=80',
    description: 'Refrescante bebida de fruta natural'
  }
];

// Iconos para las categorías
const CATEGORY_ICONS: Record<string, string> = {
  'pizzas': '🍕',
  'combos': '📦',
  'bebidas': '🥤',
  'frozen': '🍧',
  'default': '🍽️'
};

export const POSPage = () => {
  // 2. OBTENCIÓN DE DATOS (Con respaldo de seguridad)
  // Si items viene vacío o undefined, usamos MOCK_PRODUCTS para que NO se vea vacío
  const { items, categories, loading } = useMenuContext(); 
  
  // Lógica de Fallback: Si no hay datos reales, usa los de prueba
  const displayItems = (items && items.length > 0) ? items : MOCK_PRODUCTS;
  const displayCategories = (categories && categories.length > 0) ? categories : MOCK_CATEGORIES;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [productToEdit, setProductToEdit] = useState<ProductUI | null>(null);

  // 3. CONVERTIDOR DE DATOS (DB -> UI)
  const convertToProductUI = (item: MenuItem): ProductUI => {
    let behavior: ProductBehavior = 'STANDARD';
    
    // Determinamos el comportamiento (Motor)
    if (item.comboEligible) behavior = 'COMBO_PACK';
    else if (item.usesIngredients) behavior = 'CUSTOM_BUILDER';
    else if (item.usesFlavors) behavior = 'SIMPLE_VARIANT';

    return {
      ...item,
      behavior,
      // Inicializamos configuraciones vacías para evitar errores
      // (Aquí deberías conectar tus datos reales de Combos/Ingredientes cuando los tengas)
      comboConfig: item.comboEligible ? { 
        slots: [
            { id: 'slot1', title: 'Bebida', isRequired: true, isSwappable: true, defaultOptionId: 'coke', options: [{id: 'coke', name: 'Coca Cola', price: 1.00}, {id: 'water', name: 'Agua', price: 0.50}] }
        ] 
      } : undefined, 
      builderConfig: item.usesIngredients ? { 
        ingredients: [
            { id: 'ing1', name: 'Queso Extra', price: 1.50, isDefault: false },
            { id: 'ing2', name: 'Pepperoni', price: 0.00, isDefault: true }
        ] 
      } : undefined,
      variantConfig: item.usesFlavors ? { 
        groups: [
            { id: 'flavor', name: 'Sabor', options: [{id: 'fresa', name: 'Fresa'}, {id: 'mango', name: 'Mango'}] }
        ] 
      } : undefined,
    };
  };

  // 4. FILTRADO ROBUSTO (Arreglado el bug de IDs)
  const filteredProducts = useMemo(() => {
    return displayItems.filter((p) => {
      // Convertimos a String para asegurar que "1" sea igual a 1
      const pCatId = String(p.categoryId || '');
      const selCatId = String(selectedCategoryId);

      const matchesCategory = selectedCategoryId === 'all' || pCatId === selCatId;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [displayItems, selectedCategoryId, searchTerm]);

  const handleProductClick = (item: MenuItem) => {
    setProductToEdit(convertToProductUI(item));
  };

  const handleAddToCart = (finalItem: any) => {
    console.log("🔥 AGREGAR AL CARRITO:", finalItem);
    // Aquí conectarás tu lógica de carrito real
  };

  // Si está cargando REALMENTE (sin datos ni mocks), muestra spinner
  if (loading && !displayItems.length) {
    return (
      <div className="h-screen w-full bg-[#121212] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-[#FF5722] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium animate-pulse">Cargando sistema...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden font-sans text-gray-100">
      
      {/* =======================================================
          COLUMNA IZQUIERDA: MENÚ (Flexible)
      ======================================================= */}
      <div className="flex-1 flex flex-col h-full relative border-r border-[#333]">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col gap-4 p-4 md:p-6 bg-[#121212]/95 backdrop-blur z-10 border-b border-[#333]">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Buscador */}
            <div className="relative w-full md:w-1/3 group">
              <input 
                type="text" 
                placeholder="¿Qué desea ordenar?" 
                className="w-full bg-[#1E1E1E] border border-[#333] rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-4 top-3.5 text-gray-500">🔍</span>
            </div>

            {/* Categorías */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 custom-scrollbar">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all border
                  ${selectedCategoryId === 'all' 
                    ? 'bg-[#FF5722] border-[#FF5722] text-white shadow-lg shadow-[#FF5722]/20' 
                    : 'bg-[#1E1E1E] border-transparent text-gray-400 hover:bg-[#2A2A2A] hover:text-white'}
                `}
              >
                <span>🍽️</span> Todo
              </button>

              {displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(String(cat.id))}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all border
                    ${String(selectedCategoryId) === String(cat.id)
                      ? 'bg-[#FF5722] border-[#FF5722] text-white shadow-lg shadow-[#FF5722]/20' 
                      : 'bg-[#1E1E1E] border-transparent text-gray-400 hover:bg-[#2A2A2A] hover:text-white'}
                  `}
                >
                  <span>{CATEGORY_ICONS[cat.name.toLowerCase()] || '📂'}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* --- GRID DE PRODUCTOS --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0f0f0f]">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group relative bg-[#1E1E1E] rounded-2xl overflow-hidden cursor-pointer border border-[#333] hover:border-[#FF5722] transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,87,34,0.15)] flex flex-col h-[280px]"
              >
                {/* Imagen */}
                <div className="h-[55%] w-full relative overflow-hidden bg-gray-800">
                   {product.imageUrl ? (
                     <img 
                       src={product.imageUrl} 
                       alt={product.name} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-5xl select-none opacity-50">🍕</div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] via-transparent to-transparent opacity-80" />
                </div>
                
                {/* Info */}
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-bold text-gray-100 text-lg leading-tight line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-xs line-clamp-1">
                      {product.description || "Deliciosa opción de la casa"}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                     <span className="text-[#FF5722] font-black text-xl">
                       ${product.price.toFixed(2)}
                     </span>
                     <div className="w-8 h-8 rounded-full bg-[#333] group-hover:bg-[#FF5722] flex items-center justify-center text-white transition-colors">
                       +
                     </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg">No hay productos en esta categoría.</p>
                <button onClick={() => setSelectedCategoryId('all')} className="text-[#FF5722] mt-2 underline">
                  Ver todo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =======================================================
          COLUMNA DERECHA: CARRITO (Fija)
      ======================================================= */}
      <div className="w-[380px] xl:w-[420px] bg-[#1a1a1a] border-l border-[#333] shadow-2xl z-20 flex flex-col">
         {/* Sidebar del carrito */}
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
      </div>

      {/* =======================================================
          MODAL FLOTANTE
      ======================================================= */}
      <ProductSelectionModal 
        isOpen={!!productToEdit} 
        onClose={() => setProductToEdit(null)} 
        product={productToEdit}
        onAddToCart={handleAddToCart}
      />

    </div>
  );
};