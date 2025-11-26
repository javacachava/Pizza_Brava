import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { CATEGORIES } from "../constants/data";

export default function MenuPanel({ menuItems, onProductClick }) {
  const [activeCategory, setActiveCategory] = useState("Pizzas");
  const [searchQuery, setSearchQuery] = useState("");

  // Subfiltros
  const [drinkFilter, setDrinkFilter] = useState("Fría");
  const [burgerFilter, setBurgerFilter] = useState("Individual");
  const [pizzaFilter, setPizzaFilter] = useState("Individual"); // Nuevo filtro Pizzas

  const filteredProducts = useMemo(() => {
    let products = menuItems;

    // 1. Filtro por categoría principal
    products = products.filter(
      (item) => item.mainCategory === activeCategory
    );

    // 2. Subfiltros específicos
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

    // Lógica Nueva: Filtro de Pizzas (Individual vs Combo)
    if (activeCategory === "Pizzas") {
      products = products.filter(
        (item) => item.pizzaCategory === pizzaFilter
      );
    }

    // 3. Buscador
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
    burgerFilter,
    pizzaFilter // Agregado a dependencias
  ]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-amber-900 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pizza Brava <span className="text-amber-400">POS</span>
          </h1>
          <p className="text-xs text-amber-200 opacity-80">Recepción</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 rounded-full bg-amber-800 border-none text-white placeholder-amber-300/50 focus:ring-2 focus:ring-amber-500 outline-none w-48 lg:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs Categorías */}
      <div className="flex bg-white shadow-sm overflow-x-auto scrollbar-hide">
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

      {/* Submenús Dinámicos */}
      <div className="px-4 pt-4 pb-3 bg-slate-50 border-b border-slate-200">
        
        {/* Submenú Pizzas */}
        {activeCategory === "Pizzas" && (
          <div className="flex gap-3 justify-center">
            {["Individual", "Combo"].map((type) => (
              <button
                key={type}
                onClick={() => setPizzaFilter(type)}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
                  pizzaFilter === type
                    ? "bg-amber-600 text-white border-amber-700 shadow-md"
                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {type}s
              </button>
            ))}
          </div>
        )}

        {/* Submenú Bebidas */}
        {activeCategory === "Bebidas" && (
          <div className="flex gap-3 justify-center">
            {["Fría", "Caliente"].map((t) => (
              <button
                key={t}
                onClick={() => setDrinkFilter(t)}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
                  drinkFilter === t
                    ? "bg-blue-600 text-white border-blue-700 shadow-md"
                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        )}

        {/* Submenú Hamburguesas */}
        {activeCategory === "Hamburguesas" && (
          <div className="flex gap-3 justify-center">
            {["Individual", "Combo"].map((t) => (
              <button
                key={t}
                onClick={() => setBurgerFilter(t)}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
                  burgerFilter === t
                    ? "bg-orange-600 text-white border-orange-700 shadow-md"
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
      <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
        {menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>Cargando menú...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>Sin productos aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductClick(product)}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 flex flex-col items-start text-left group active:scale-95 h-full"
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
                {/* Etiqueta si es Clásica */}
                {product.pizzaType === 'Clasica' && (
                  <span className="mt-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    Elige tamaño
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