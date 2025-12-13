import { useState } from 'react';
import { useMenuContext } from '../../../contexts/MenuContext';
import type { ProductUI, ProductBehavior } from '../../../models/ProductTypes';
import type { MenuItem } from '../../../models/MenuItem';
import { ProductSelectionModal } from '../../components/modals/ProductSelectionModal';

const CATEGORIES = [
  { id: 'all', label: 'Todo' },
  { id: 'combos', label: 'Combos' },
  { id: 'pizzas', label: 'Pizzas' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'frozen', label: 'Frozen' },
];

export const POSPage = () => {
  // 1. BLINDAJE AQUÍ: Asignamos un array vacío por defecto si items es undefined
  const { items = [], loading } = useMenuContext(); 
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [productToEdit, setProductToEdit] = useState<ProductUI | null>(null);

  // Convierte los datos de la DB al formato de la UI
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

  const handleProductClick = (item: MenuItem) => {
      setProductToEdit(convertToProductUI(item));
  };

  // 2. SEGURIDAD ADICIONAL: Usamos el operador ?. y || por si acaso
  const filteredProducts = (items || []).filter((p) => {
    if (!p) return false;
    // Asumiendo que categoryId es string. Si es ID numérico, convierte con String(p.categoryId)
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory; 
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="p-10 text-white text-center">Cargando menú...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col p-4 gap-6">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#121212] py-2 sticky top-0 z-10">
        <input 
          type="text" 
          placeholder="Buscar producto..." 
          className="w-full md:w-1/3 bg-[#1E1E1E] border border-[#333] rounded-full py-3 px-6 text-white focus:outline-none focus:border-[#FF5722]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-[#FF5722] text-white' : 'bg-[#1E1E1E] text-gray-400 hover:text-white'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* GRID DE PRODUCTOS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div 
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="bg-[#1E1E1E] rounded-2xl overflow-hidden cursor-pointer hover:border-[#FF5722] border-2 border-transparent transition-all shadow-md group"
            >
              <div className="h-40 bg-gray-800 relative overflow-hidden">
                 {product.imageUrl ? (
                   <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-4xl">🍕</div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] to-transparent opacity-60"></div>
              </div>
              <div className="p-4 relative">
                <h3 className="font-bold text-lg leading-tight mb-1">{product.name}</h3>
                <p className="text-[#FF5722] font-bold text-xl">${product.price.toFixed(2)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 mt-10">
            No se encontraron productos en esta categoría.
          </div>
        )}
      </div>

      <ProductSelectionModal 
        isOpen={!!productToEdit} 
        onClose={() => setProductToEdit(null)} 
        product={productToEdit}
        onAddToCart={(item) => console.log("Carrito:", item)}
      />
    </div>
  );
};