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
  Croissant
} from "lucide-react";
import { CATEGORIES } from "../constants/data";

// Helper para iconos de categoría (Adaptado del AdminPanel)
const getCategoryIcon = (catName, isActive) => {
  const lower = (catName || "").toLowerCase();
  const baseSize = 16;
  
  // Si está activo, forzamos blanco. Si no, usamos los colores distintivos del AdminPanel.
  if (lower.includes("pizza")) return <Pizza size={baseSize} className={isActive ? "text-white" : "text-orange-400"} />;
  if (lower.includes("hamburguesa") || lower.includes("burger")) return <Sandwich size={baseSize} className={isActive ? "text-white" : "text-orange-400"} />;
  if (lower.includes("bebida") || lower.includes("drink")) return <CupSoda size={baseSize} className={isActive ? "text-white" : "text-blue-400"} />;
  if (lower.includes("combo")) return <Layers size={baseSize} className={isActive ? "text-white" : "text-purple-400"} />;
  if (lower.includes("postre") || lower.includes("helado")) return <IceCream size={baseSize} className={isActive ? "text-white" : "text-pink-400"} />;
  if (lower.includes("birria") || lower.includes("sopa")) return <Soup size={baseSize} className={isActive ? "text-white" : "text-red-400"} />;
  if (lower.includes("complemento") || lower.includes("side")) return <Croissant size={baseSize} className={isActive ? "text-white" : "text-yellow-400"} />;
  
  return <UtensilsCrossed size={baseSize} className={isActive ? "text-white" : "text-slate-500"} />;
};

export default function MenuPanel({
  menuItems,
  onProductClick,
  onLogout,
  onHistory
}) {
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

    // Ordenar por nombre para que no esté todo random
    return products.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100">
      {/* HEADER */}
      <header className="px-5 py-3 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-500">
            Recepción
          </span>
          <span className="text-sm font-semibold text-slate-100">
            Tomar pedido
          </span>
        </div>

        <div className="flex-1 flex items-center gap-3 ml-4">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-slate-500"
            />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Historial */}
          <button
            type="button"
            onClick={onHistory}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-100 hover:bg-slate-800 hover:border-orange-400 transition-colors"
          >
            <History size={14} />
            Historial
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-900/20 border border-red-700/60 text-[11px] font-semibold text-red-200 hover:bg-red-800/50 hover:border-red-400 transition-colors"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>
      </header>

      {/* CATEGORÍAS */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-800 bg-slate-950/90">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-2 border transition-all ${
                  isActive
                    ? "bg-orange-500 text-white border-orange-400 shadow shadow-orange-500/30"
                    : "bg-slate-900 text-slate-300 border-slate-700 hover:border-orange-400 hover:text-orange-200"
                }`}
              >
                {getCategoryIcon(cat.label, isActive)}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTA DE PRODUCTOS */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-70">
            <UtensilsCrossed size={52} className="mb-3 stroke-1" />
            <p className="text-sm font-medium">Sin resultados en esta categoría.</p>
            <p className="text-xs text-slate-500 mt-1">
              Prueba otra categoría o ajusta la búsqueda.
            </p>
          </div>
        ) : (
          // ...
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product, index) => { // ✅ Index agregado
              const isCombo = product.isCombo === true;
              const isClassic = product.isClassic === true;
              const price =
                typeof product.price === "number"
                  ? product.price
                  : Number(product.price || 0);

              return (
                <button
                  key={product.id || product._signature || `${product.name}-${index}`} // ✅ Key segura
                  type="button"
                  onClick={() => onProductClick(product)}
                  className="group relative bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-orange-500/60 hover:bg-slate-900 shadow-sm hover:shadow-orange-500/20 hover:shadow-lg transition-all duration-150 text-left flex flex-col overflow-hidden"
                >
                  {/* Glow superior */}
                  <div className="absolute inset-x-0 -top-8 h-12 bg-gradient-to-b from-orange-500/40 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />

                  <div className="p-3 flex-1 flex flex-col gap-2 relative z-10">
                    {/* Badges */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                        {product.mainCategory || "Sin categoría"}
                      </span>
                      <div className="flex gap-1">
                        {isCombo && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-500/40">
                            Combo
                          </span>
                        )}
                        {isClassic && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-200 border border-orange-500/40">
                            Clásica
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Nombre */}
                    <div className="min-h-[2.5rem]">
                      <p className="text-xs sm:text-sm font-semibold text-slate-50 leading-tight line-clamp-2">
                        {product.name}
                      </p>
                    </div>

                    {/* Subinfo opcional */}
                    {product.description && (
                      <p className="text-[10px] text-slate-400 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Footer de tarjeta */}
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-slate-500">
                          Desde
                        </span>
                        <span className="text-sm font-black text-orange-400 tracking-tight">
                          ${price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <ChevronRight size={18} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}