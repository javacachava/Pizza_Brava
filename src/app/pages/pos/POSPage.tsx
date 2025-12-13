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
  const { items, loading } = useMenuContext(); 
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
      comboConfig: item.comboEligible ? { slots: [] } : undefined, // Aquí deberías cargar tus datos reales
      builderConfig: item.usesIngredients ? { ingredients: [] } : undefined,
      variantConfig: item.usesFlavors ? { groups: [] } : undefined,
    };
  };

  const handleProductClick = (item: MenuItem) => {
      setProductToEdit(convertToProductUI(item));
  };

  const filteredProducts = items.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || String(p.categoryId) === selectedCategory; 
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="p-10 text-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col p-4 gap-6">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#121212] py-2">
        <input 
          type="text" 
          placeholder="Buscar..." 
          className="w-full md:w-1/3 bg-[#1E1E1E] border border-[#333] rounded-full py-3 px-6 text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap ${selectedCategory === cat.id ? 'bg-[#FF5722]' : 'bg-[#1E1E1E]'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <div 
            key={product.id}
            onClick={() => handleProductClick(product)}
            className="bg-[#1E1E1E] rounded-2xl overflow-hidden cursor-pointer hover:border-[#FF5722] border-2 border-transparent transition-all"
          >
            <div className="h-40 bg-gray-800 relative">
               {product.imageUrl && <img src={product.imageUrl} className="w-full h-full object-cover" />}
            </div>
            <div className="p-4">
              <h3 className="font-bold">{product.name}</h3>
              <p className="text-[#FF5722] font-bold">${product.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
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