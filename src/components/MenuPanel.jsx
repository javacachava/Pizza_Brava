// src/components/MenuPanel.jsx
import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { CATEGORIES } from "../constants/data";

export default function MenuPanel({ menuItems, onProductClick }) {
  const [activeCategory, setActiveCategory] = useState("Pizzas");
  const [searchQuery, setSearchQuery] = useState("");

  // Subfiltros
  const [drinkFilter, setDrinkFilter] = useState("Fría"); // Fría | Caliente
  const [burgerFilter, setBurgerFilter] = useState("Individual"); // Individual | Combo

  const filteredProducts = useMemo(() => {
    let products = menuItems;

    // Filtro por categoría principal
    products = products.filter(
      (item) => item.mainCategory === activeCategory
    );

    // Subfiltros por categoría
    if (activeCategory === "Bebidas") {
      products = products.filter(
        (item) => item.drinkTemperature === drinkFilter
      );
    }

    if (activeCategory === "Hamburguesas") {
      products = products.filter(
        (item) => item.burgerType === burgerFilter
      );
    }

    // Buscador
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter((p) =>
        p.name.toLowerCase().includes(q)
      );
    }

    return products;
  }, [
    menuItems,
    activeCategory,
    searchQuery,
    drinkFilter,
    burgerFilter
  ]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-amber-900 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pizza Brava <span className="text-amber-400">POS</span>
          </h1>
          <p className="text-xs text-amber-200 opacity-80">
            Recepción
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
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-4 ${
              activeCategory === cat.id
                ? "border-amber-600 text-amber-900 bg-amber-50"
                : "border-transparent text-slate-500 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

     <div className="px-4 pt-4 pb-3 bg-slate-50 border-b border-slate-200 flex justify-center">
  {/* Submenú para Bebidas */}
  {activeCategory === "Bebidas" && (
    <div className="flex gap-4 justify-center">
      {["Fría", "Caliente"].map((t) => (
        <button
          key={t}
          onClick={() => setDrinkFilter(t)}
          className={`px-6 py-3 rounded-2xl text-sm font-semibold border shadow-sm transition-all ${
            drinkFilter === t
              ? "bg-amber-200 border-amber-500 text-amber-900 scale-105"
              : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
        >
          {t}s
        </button>
      ))}
    </div>
  )}

  {/* Submenú para Hamburguesas */}
  {activeCategory === "Hamburguesas" && (
    <div className="flex gap-4 justify-center">
      {["Individuale", "Combo"].map((t) => (
        <button
          key={t}
          onClick={() => setBurgerFilter(t)}
          className={`px-6 py-3 rounded-2xl text-sm font-semibold border shadow-sm transition-all ${
            burgerFilter === t
              ? "bg-amber-200 border-amber-500 text-amber-900 scale-105"
              : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
        >
          {t}s
        </button>
      ))}
    </div>
  )}
</div>


      {/* Grid Productos */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
        {menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>Cargando menú...</p>
            <p className="text-xs mt-2">
              Conectando con Firestore...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>Sin productos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductClick(product)}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 flex flex-col items-start text-left group active:scale-95"
              >
                <div className="w-full flex justify-between items-start mb-2">
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                    {product.station || "cocina"}
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
