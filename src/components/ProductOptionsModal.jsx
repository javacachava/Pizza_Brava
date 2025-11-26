import React, { useState, useEffect, useMemo } from "react";
import { X, CheckSquare, Square, ChefHat, ChevronRight } from "lucide-react";

// Eliminamos los imports de constantes. Todo entra por props.

export default function ProductOptionsModal({ isOpen, product, onClose, onConfirm, globalConfig }) {
  if (!isOpen || !product || !globalConfig) return null;

  // Desestructuramos la config que viene de Firebase
  const { ingredients: ingredientsList, sides: sidesList, drinks: drinksList, rules } = globalConfig;

  const [size, setSize] = useState("Personal");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [selectedSide, setSelectedSide] = useState("");
  const [selectedDrink, setSelectedDrink] = useState("");

  // Configuración específica del producto (si es pizza, combo, etc)
  const productConfig = product.config || {
    allowSize: product.name.includes("Clásica") || product.pizzaType === "Clasica",
    allowIngredients: product.mainCategory === "Pizzas" || product.name.includes("Combo"),
    allowSides: product.name.includes("Combo") || product.mainCategory === "Platos",
    allowDrinks: product.name.includes("Combo") || product.mainCategory === "Platos",
    includedIngredients: (product.name.includes("Clásica") || product.pizzaType === "Clasica") ? 2 : 0
  };

  useEffect(() => {
    setSize("Personal");
    setSelectedIngredients([]);
    // Asignar valores por defecto dinámicos (si existen en la lista)
    if (sidesList.length > 0) setSelectedSide(sidesList[0]);
    if (drinksList.length > 0) setSelectedDrink(drinksList[0]);
  }, [product, sidesList, drinksList]);

  // Cálculo de Precio usando reglas de DB
  const currentBasePrice = useMemo(() => {
    let price = product.price;
    if (productConfig.allowSize && rules.sizes[size]) {
      price += rules.sizes[size].priceModifier;
    }
    return price;
  }, [product, size, productConfig, rules]);

  const extraIngredientsCount = Math.max(0, selectedIngredients.length - productConfig.includedIngredients);
  const extraCost = extraIngredientsCount * rules.ingredientPrice;
  const finalPrice = currentBasePrice + extraCost;

  const toggleIngredient = (ing) => {
    setSelectedIngredients(prev => 
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const handleConfirm = () => {
    if (productConfig.includedIngredients > 0 && selectedIngredients.length < productConfig.includedIngredients) {
      alert(`Debes elegir al menos ${productConfig.includedIngredients} ingredientes.`);
      return;
    }

    let details = [];
    if (productConfig.allowSize) details.push(size);
    if (productConfig.allowSides) details.push(`Entrada: ${selectedSide}`);
    if (productConfig.allowDrinks) details.push(`Bebida: ${selectedDrink}`);
    
    const cartItem = {
      ...product,
      cartItemId: `${product.id}-${Date.now()}`,
      price: Number(finalPrice.toFixed(2)),
      ingredients: selectedIngredients,
      details: details,
      selectedSize: productConfig.allowSize ? size : null,
      isConfigured: true,
      name: `${product.name} ${productConfig.allowSize ? `(${size})` : ''}`
    };

    onConfirm(cartItem);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="bg-amber-900 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ChefHat size={20} className="text-amber-400"/> 
            {product.name}
          </h3>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><X size={20}/></button>
        </div>

        <div className="p-5 bg-slate-50 flex-1 overflow-y-auto space-y-6">
          
          {/* SECCIÓN TAMAÑO */}
          {productConfig.allowSize && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selecciona Tamaño</h4>
              <div className="flex gap-2">
                {Object.keys(rules.sizes).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSize(key)}
                    className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-all ${
                      size === key ? "bg-amber-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {rules.sizes[key].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN COMBOS (Dinámica desde DB) */}
          {(productConfig.allowSides || productConfig.allowDrinks) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              {productConfig.allowSides && sidesList.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Elige Entrada</label>
                  <select 
                    className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500"
                    value={selectedSide}
                    onChange={(e) => setSelectedSide(e.target.value)}
                  >
                    {sidesList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              {productConfig.allowDrinks && drinksList.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Elige Bebida</label>
                  <select 
                    className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500"
                    value={selectedDrink}
                    onChange={(e) => setSelectedDrink(e.target.value)}
                  >
                    {drinksList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN INGREDIENTES (Dinámica desde DB) */}
          {productConfig.allowIngredients && ingredientsList.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingredientes</h4>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  productConfig.includedIngredients > 0 && selectedIngredients.length < productConfig.includedIngredients 
                  ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {selectedIngredients.length} {productConfig.includedIngredients > 0 ? `/ ${productConfig.includedIngredients} Incluidos` : 'Seleccionados'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {ingredientsList.map((ing) => {
                  const isSelected = selectedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      onClick={() => toggleIngredient(ing)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border text-left transition-all active:scale-95 ${
                        isSelected 
                        ? "bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected ? <CheckSquare size={16}/> : <Square size={16}/>}
                      <span className="truncate">{ing}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900">${finalPrice.toFixed(2)}</p>
          </div>
          <button 
            onClick={handleConfirm}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2"
          >
            Agregar <ChevronRight size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}