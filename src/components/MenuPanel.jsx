import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { CATEGORIES } from "../constants/data";

export default function MenuPanel({ menuItems, onProductClick }) {
  const [activeCategory, setActiveCategory] = useState("Pizzas");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    // 1. Filtrar solo por categoría principal (Pizzas, Bebidas, etc.)
    let products = menuItems.filter((item) => item.mainCategory === activeCategory);

    // 2. Buscador
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(q));
    }

    return products;
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-amber-900 text-white p-4 shadow-md flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pizza Brava <span className="text-amber-400">POS</span>
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 rounded-full bg-amber-800 border-none text-white placeholder-amber-300/50 focus:ring-2 focus:ring-amber-500 outline-none w-48"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categorías Principales (Sin submenús) */}
      <div className="flex bg-white shadow-sm overflow-x-auto scrollbar-hide shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setSearchQuery("");
            }}
            className={`flex-shrink-0 px-6 py-4 font-medium transition-colors border-b-4 ${
              activeCategory === cat.id
                ? "border-amber-600 text-amber-900 bg-amber-50"
                : "border-transparent text-slate-500 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>No hay productos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-20 md:pb-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductClick(product)}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 flex flex-col items-start text-left group active:scale-95 h-full relative"
              >
                <div className="w-full flex justify-between items-start mb-2">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                    {product.station || "cocina"}
                  </span>
                  <span className="font-bold text-lg text-slate-900">
                    ${product.price?.toFixed(2)}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-700 group-hover:text-amber-700 leading-tight line-clamp-2">
                  {product.name}
                </h3>
                
                {/* Etiqueta visual solo si es Pizza Clásica */}
                {(product.pizzaType === "Clasica" || product.name.includes("Clásica")) && (
                  <span className="absolute bottom-4 right-4 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    Armar
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}