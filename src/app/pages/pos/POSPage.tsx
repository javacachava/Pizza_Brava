import { useState } from 'react';
import { useMenuContext } from '../../../contexts/MenuContext';
import type { ProductUI, ProductBehavior } from '../../../models/ProductTypes';
import type { MenuItem } from '../../../models/MenuItem';
import { ProductSelectionModal } from '../../components/modals/ProductSelectionModal';
import { CartSidebar } from './CartSidebar'; // <--- RECUPERADO

const CATEGORIES = [
  { id: 'all', label: 'Todo' },
  { id: 'combos', label: 'Combos' },
  { id: 'pizzas', label: 'Pizzas' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'frozen', label: 'Frozen' },
];

export const POSPage = () => {
  // Blindaje para evitar el error de pantalla blanca
  const { items = [], loading } = useMenuContext(); 
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [productToEdit, setProductToEdit] = useState<ProductUI | null>(null);

  // Conversión de datos DB -> UI
  const convertToProductUI = (item: MenuItem): ProductUI => {
    let behavior: ProductBehavior = 'STANDARD';
    // Usamos TUS campos de la base de datos para decidir la lógica
    if (item.comboEligible) behavior = 'COMBO_PACK';
    else if (item.usesIngredients) behavior = 'CUSTOM_BUILDER';
    else if (item.usesFlavors) behavior = 'SIMPLE_VARIANT';

    return {
      ...item,
      behavior,
      // Inicializamos vacíos, estos se llenarán cuando conectes los servicios completos
      comboConfig: item.comboEligible ? { slots: [] } : undefined, 
      builderConfig: item.usesIngredients ? { ingredients: [] } : undefined,
      variantConfig: item.usesFlavors ? { groups: [] } : undefined,
    };
  };

  const handleProductClick = (item: MenuItem) => {
      setProductToEdit(convertToProductUI(item));
  };

  // Filtrado seguro
  const filteredProducts = (items || []).filter((p) => {
    if (!p) return false;
    const matchesCategory = selectedCategory === 'all' || String(p.categoryId) === selectedCategory; 
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Cargando menú...</div>;

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden text-white">
      
      {/* === COLUMNA IZQUIERDA: MENÚ DE PRODUCTOS (Flexible) === */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Header Sticky */}
        <header className="flex flex-col gap-4 p-4 md:p-6 bg-[#121212] border-b border-[#333] z-10">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Buscador */}
            <div className="relative w-full md:w-1/3">
              <input 
                type="text" 
                placeholder="Buscar producto..." 
                className="w-full bg-[#1E1E1E] border border-[#333] rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-4 top-3.5 text-gray-500">🔍</span>
            </div>

            {/* Tabs Categorías */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 custom-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-[#FF5722] text-white shadow-lg shadow-orange-900/20' : 'bg-[#1E1E1E] text-gray-400 hover:bg-[#333] hover:text-white'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Grid Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-[#1E1E1E] rounded-2xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#FF5722] border border-transparent transition-all shadow-lg group flex flex-col h-full"
                >
                  <div className="h-40 bg-gray-800 relative overflow-hidden shrink-0">
                     {product.imageUrl ? (
                       <img src={product.imageUrl} alt={product.name} className="w-full h-full object