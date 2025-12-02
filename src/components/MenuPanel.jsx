// src/components/MenuPanel.jsx
import React, { useState, useMemo } from "react";
import {
  Search,
  UtensilsCrossed,
  LogOut,
  History,
  ChevronRight,
  Pizza,
  Sandwich,
  CupSoda,
  Layers,
  IceCream,
  Soup,
  Croissant,
  Plus
} from "lucide-react";
import { CATEGORIES } from "../constants/data";

// Helper de iconos (Mantenido, solo ajustado tamaño visual)
const getCategoryIcon = (catName, isActive) => {
  const lower = (catName || "").toLowerCase();
  const size = 26; // Iconos más grandes para tablet
  const colorClass = isActive ? "text-white" : "text-slate-500 group-hover:text-orange-500";
  
  if (lower.includes("pizza")) return <Pizza size={size} className={colorClass} />;
  if (lower.includes("hamburguesa")) return <Sandwich size={size} className={colorClass} />;
  if (lower.includes("bebida")) return <CupSoda size={size} className={colorClass} />;
  if (lower.includes("combo")) return <Layers size={size} className={colorClass} />;
  if (lower.includes("postre")) return <IceCream size={size} className={colorClass} />;
  if (lower.includes("birria")) return <Soup size={size} className={colorClass} />;
  if (lower.includes("complemento")) return <Croissant size={size} className={colorClass} />;
  return <UtensilsCrossed size={size} className={colorClass} />;
};

export default function MenuPanel({
  menuItems,
  onProductClick,
  onLogout,
  onHistory
}) {
  // --- LÓGICA ORIGINAL INTACTA ---
  const [activeCategory, setActiveCategory] = useState("Pizzas");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(menuItems)) return [];

    let products = menuItems.filter(
      (item) => item.mainCategory === activeCategory
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      products = products.filter((p) =>
        String(p.name || "").toLowerCase().includes(q)
      );
    }

    return products.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }, [menuItems, activeCategory, searchQuery]);
  // -------------------------------

  return (
    <div className="h-full flex bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* 1. SIDEBAR LATERAL (Navegación Estilo Kiosco) */}
      <aside className="w-24 md:w-32 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-3 overflow-y-auto no-scrollbar z-20">
        {/* Logo / Brand */}
        <div className="mb-4 p-3 bg-orange-600 rounded-2xl shadow-lg shadow-orange-900/40">
            <UtensilsCrossed size={32} className="text-white" />
        </div>

        {/* Lista de Categorías */}
        <div className="flex-1 w-full px-2 space-y-3">
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`group w-full aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-900/40 scale-105"
                    : "bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {getCategoryIcon(cat.label, isActive)}
                <span className="text-[10px] font-bold uppercase tracking-wide text-center px-1 leading-none">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Acciones del Sistema (Footer del Sidebar) */}
        <div className="mt-auto w-full px-3 space-y-3 pt-4 border-t border-slate-800">
            <button 
              onClick={onHistory} 
              className="w-full aspect-square rounded-2xl bg-slate-800 text-slate-400 flex flex-col items-center justify-center gap-1 hover:bg-slate-700 hover:text-white transition-colors"
              title="Historial"
            >
                <History size={24} />
                <span className="text-[9px] font-bold uppercase">Historial</span>
            </button>
            <button 
              onClick={onLogout} 
              className="w-full aspect-square rounded-2xl bg-red-900/10 text-red-400 flex flex-col items-center justify-center gap-1 hover:bg-red-900/30 hover:text-red-200 border border-red-900/20 transition-colors"
              title="Salir"
            >
                <LogOut size={24} />
                <span className="text-[9px] font-bold uppercase">Salir</span>
            </button>
        </div>
      </aside>

      {/* 2. ÁREA CENTRAL (Grid de Productos) */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {/* Header de Búsqueda */}
        <header className="p-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-10 flex items-center justify-between gap-4">
           <div>
              <h2 className="text-2xl font-black text-white tracking-tight">{activeCategory}</h2>
              <p className="text-xs text-slate-500 font-medium">{filteredProducts.length} productos disponibles</p>
           </div>
           <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
              <input 
                  type="text" 
                  placeholder={`Buscar en ${activeCategory}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-lg pl-12 pr-4 py-3 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none placeholder:text-slate-600 transition-all shadow-inner"
              />
           </div>
        </header>

        {/* Grid Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60 pb-20">
              <Search size={64} strokeWidth={1.5} className="mb-4" />
              <p className="text-xl font-medium">No se encontraron productos</p>
              <p className="text-sm mt-2">Intenta con otra búsqueda o categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-24">
              {filteredProducts.map((product, index) => {
                 // Lógica visual
                 const isCombo = product.isCombo === true;
                 const isClassic = product.isClassic === true;
                 const price = Number(product.price || 0);

                 return (
                  <button
                    key={product.id || `${product.name}-${index}`}
                    type="button"
                    onClick={() => onProductClick(product)}
                    className="group relative flex flex-col justify-between bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-[2rem] p-5 shadow-md hover:shadow-2xl hover:shadow-orange-900/10 hover:-translate-y-1 transition-all duration-200 text-left h-56 active:scale-[0.98]"
                  >
                    <div>
                       <div className="flex gap-2 mb-3">
                          {isCombo && (
                             <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                               Combo
                             </span>
                          )}
                          {isClassic && (
                             <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
                               Clásica
                             </span>
                          )}
                       </div>
                       <h3 className="text-lg font-bold text-slate-100 leading-snug line-clamp-3 group-hover:text-orange-400 transition-colors">
                          {product.name}
                       </h3>
                       {product.description && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                             {product.description}
                          </p>
                       )}
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between w-full">
                       <span className="text-2xl font-black text-white tracking-tight">
                          ${price.toFixed(2)}
                       </span>
                       <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-orange-500 flex items-center justify-center text-slate-400 group-hover:text-white transition-all shadow-sm">
                          <Plus size={20} strokeWidth={3} />
                       </div>
                    </div>
                  </button>
                 );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}