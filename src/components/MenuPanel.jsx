import React, { useState, useMemo } from "react";
import { Search, UtensilsCrossed, Flame, LogOut, History, ChevronRight } from "lucide-react";
import { CATEGORIES } from "../constants/data";

export default function MenuPanel({ menuItems, onProductClick, onLogout, onHistory }) {
  const [activeCategory, setActiveCategory] = useState("Pizzas");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    let products = menuItems.filter((item) => item.mainCategory === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(q));
    }
    return products;
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md px-6 py-4 shadow-lg flex justify-between items-center shrink-0 border-b border-slate-800 z-10 gap-4">
        
        {/* Título */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-xl shadow-lg shadow-orange-500/20">
            <Flame className="text-white fill-white" size={24} /> 
          </div>
          <h1 className="text-xl font-black tracking-tight text-white hidden sm:block">
            Pizza<span className="text-orange-500">Brava</span>
          </h1>
        </div>

        {/* Buscador Oscuro */}
        <div className="relative group flex-1 max-w-md mx-auto">
          <Search className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar producto..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:ring-2 focus:ring-orange-500 focus:bg-slate-900 focus:border-transparent outline-none transition-all placeholder-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2 shrink-0">
            <button 
                onClick={onHistory}
                className="p-2.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400 rounded-xl transition-all border border-transparent hover:border-slate-700"
                title="Historial"
            >
                <History size={22} />
            </button>
            <div className="h-8 w-px bg-slate-800 mx-1"></div>
            <button 
                onClick={onLogout}
                className="p-2.5 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                title="Salir"
            >
                <LogOut size={22} />
            </button>
        </div>
      </div>

      {/* Categorías (Píldoras Oscuras) */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar flex gap-2 shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setSearchQuery(""); }}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 transform active:scale-95 whitespace-nowrap border ${
              activeCategory === cat.id
                ? "bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-900/30"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-60">
            <UtensilsCrossed size={64} className="mb-4 stroke-1"/>
            <p className="text-lg font-medium">Sin resultados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 pb-20 md:pb-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductClick(product)}
                className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-start text-left group relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-orange-900/10 hover:border-orange-500/50 hover:-translate-y-1 active:scale-[0.98] h-full"
              >
                {/* Glow Effect on Hover */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="p-5 w-full flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3 w-full">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                            product.station === 'cocina' 
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                            {product.station || "cocina"}
                        </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-200 group-hover:text-orange-400 transition-colors text-lg leading-tight mb-2 line-clamp-2">
                        {product.name}
                    </h3>
                    
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
                        {product.description || "Deliciosa preparación especial de la casa."}
                    </p>

                    <div className="w-full flex justify-between items-end mt-auto pt-4 border-t border-slate-800/50">
                        <span className="font-black text-xl text-white group-hover:text-orange-200 transition-colors">
                            ${product.price?.toFixed(2)}
                        </span>
                        <div className="bg-slate-800 p-2 rounded-lg text-slate-500 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <ChevronRight size={18} strokeWidth={3}/>
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