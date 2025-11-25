import React, { useState, useMemo } from "react";
import { Search, Flame, ChefHat, Utensils, Coffee } from "lucide-react"; // Importación unificada
import { CATEGORIES } from "../constants/data";

// Mapeo explícito de componentes
const ICONS = {
  Flame: Flame,
  ChefHat: ChefHat,
  Utensils: Utensils,
  Coffee: Coffee
};

export default function MenuPanel({ menuItems, onAddToCart }) {
  const [activeCategory, setActiveCategory] = useState("Pizzas");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    let products = menuItems.filter(
      (item) => item.category === activeCategory
    );
    if (searchQuery) {
      products = menuItems.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return products;
  }, [activeCategory, searchQuery, menuItems]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-amber-900 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pizza Brava <span className="text-amber-400">POS</span>
          </h1>
          <p className="text-xs text-amber-200 opacity-80">
            Recepción con Gemini AI ✨
          </p>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar producto..."
            className="pl-10 pr-4 py-2 rounded-full bg-amber-800 border-none text-white placeholder-amber-300/50 focus:ring-2 focus:ring-amber-500 outline-none w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs Categorías */}
      <div className="flex bg-white shadow-sm overflow-x-auto">
        {CATEGORIES.map((cat) => {
          // Fallback seguro si el icono no existe en el mapa
          const IconComponent = ICONS[cat.icon] || Search; 

          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-4 ${
                activeCategory === cat.id && !searchQuery
                  ? "border-amber-600 text-amber-900 bg-amber-50"
                  : "border-transparent text-slate-500 hover:bg-slate-50"
              }`}
            >
              <IconComponent size={20} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid Productos */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
        {menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>Cargando menú...</p>
            <p className="text-xs mt-2">Conectando con Firestore...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 flex flex-col items-start text-left group active:scale-95"
              >
                <div className="w-full flex justify-between items-start mb-2">
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                    {product.station}
                  </span>
                  <span className="font-bold text-lg text-slate-900">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-700 group-hover:text-amber-700 leading-tight">
                  {product.name}
                </h3>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
