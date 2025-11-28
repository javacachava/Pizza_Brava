import React, { useState, useMemo } from "react";
import { Search, UtensilsCrossed, Flame, LogOut, History } from "lucide-react";
import { CATEGORIES } from "../constants/data";

export default function MenuPanel({ menuItems, onProductClick, onLogout, onHistory }) {
  const [activeCategory, setActiveCategory] = useState("Pizzas");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    // 1. Filtrar solo por categoría principal
    let products = menuItems.filter((item) => item.mainCategory === activeCategory);

    // 2. Buscador
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(q));
    }

    return products;
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header Completo: Título, Buscador y Botones de Acción */}
      <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center shrink-0 border-b border-slate-200 z-10 gap-4">
        
        {/* Título */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Flame className="text-orange-600 fill-orange-600" size={24} /> 
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">
            Pizza Brava
          </h1>
        </div>

        {/* Barra de Búsqueda Central */}
        <div className="relative group flex-1 max-w-md mx-auto">
          <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar producto..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Botones de Acción (Movidos aquí para no tapar el carrito) */}
        <div className="flex items-center gap-2 shrink-0">
            <button 
                onClick={onHistory}
                className="p-2.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-all border border-transparent hover:border-blue-100"
                title="Ver Historial"
            >
                <History size={22} />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <button 
                onClick={onLogout}
                className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-all border border-transparent hover:border-red-100"
                title="Cerrar Sesión"
            >
                <LogOut size={22} />
            </button>
        </div>
      </div>

      {/* Categorías (Tabs estilo Píldora) */}
      <div className="px-6 py-4 bg-white border-b border-slate-200/60 overflow-x-auto no-scrollbar flex gap-2 shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setSearchQuery("");
            }}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 transform active:scale-95 whitespace-nowrap ${
              activeCategory === cat.id
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
            <UtensilsCrossed size={64} className="mb-4 stroke-1"/>
            <p className="text-lg font-medium">No hay productos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 pb-20 md:pb-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductClick(product)}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-start text-left group relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:border-orange-200 hover:-translate-y-1 active:scale-[0.98] h-full"
              >
                {/* Decoración superior */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="p-5 w-full flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3 w-full">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                            product.station === 'cocina' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                            {product.station || "cocina"}
                        </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-700 group-hover:text-orange-600 transition-colors text-lg leading-tight mb-1 line-clamp-2">
                        {product.name}
                    </h3>
                    
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 flex-1">
                        {product.description || "Deliciosa preparación especial de la casa."}
                    </p>

                    <div className="w-full flex justify-between items-end mt-auto">
                        <span className="font-black text-xl text-slate-900 group-hover:text-slate-700">
                            ${product.price?.toFixed(2)}
                        </span>
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        </div>
                    </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}