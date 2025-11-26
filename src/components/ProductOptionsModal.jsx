import React, { useState, useEffect, useMemo } from "react";
import { X, CheckSquare, Square, ChefHat, ChevronRight, UtensilsCrossed, Wine } from "lucide-react";

export default function ProductOptionsModal({ isOpen, product, onClose, onConfirm, ingredientsList, prices }) {
  if (!isOpen || !product) return null;

  // 1. DETERMINAR TIPO DE PRODUCTO Y CONFIGURACIÓN
  const isClassic = product.pizzaType === "Clasica" || product.name.toLowerCase().includes("clásica");
  const isPizza = product.mainCategory === "Pizzas";
  
  // Si el producto trae "comboOptions" de Firebase, las usamos. Si no, objeto vacío.
  const comboOpts = product.comboOptions || {}; 

  // 2. ESTADOS
  const [size, setSize] = useState("Personal");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  
  // Estados para opciones dinámicas del combo (si existen en la DB)
  const [selectedSide, setSelectedSide] = useState("");
  const [selectedDrink, setSelectedDrink] = useState("");

  // 3. INICIALIZACIÓN
  useEffect(() => {
    setSize("Personal");
    setSelectedIngredients([]);
    
    // Si el producto tiene opciones de acompañamiento definidas en DB, seleccionar la primera por defecto
    if (comboOpts.sideChoices && comboOpts.sideChoices.length > 0) {
        setSelectedSide(comboOpts.sideChoices[0]);
    }
    // Si el producto tiene opciones de bebida definidas en DB
    if (comboOpts.drinkChoices && comboOpts.drinkChoices.length > 0) {
        setSelectedDrink(comboOpts.drinkChoices[0]);
    }
  }, [product]);

  // 4. CÁLCULO DE PRECIOS
  const currentPrice = useMemo(() => {
    let price = product.price;
    
    // Solo sumamos precio por tamaño si es Clásica
    if (isClassic && size === "Grande") {
        price += prices.sizeDifference;
    }
    return price;
  }, [product, size, isClassic, prices]);

  // Ingredientes extra (Solo cobran si superan los incluidos)
  const includedIng = isClassic ? 2 : 0;
  const extraCount = Math.max(0, selectedIngredients.length - includedIng);
  const extraCost = extraCount * prices.extraIngredient;
  
  const finalPrice = currentPrice + extraCost;

  // 5. HANDLERS
  const toggleIngredient = (ing) => {
    setSelectedIngredients(prev => 
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const handleConfirm = () => {
    // Validación Clásica
    if (isClassic && selectedIngredients.length < 2) {
        alert("La Pizza Clásica requiere al menos 2 ingredientes.");
        return;
    }

    // Construir detalles para el ticket
    let details = [];
    if (isClassic) details.push(size);
    if (comboOpts.hasSide) details.push(`Acomp: ${selectedSide}`);
    if (comboOpts.hasDrink) details.push(`Bebida: ${selectedDrink}`);

    const cartItem = {
      ...product,
      cartItemId: `${product.id}-${Date.now()}`,
      price: Number(finalPrice.toFixed(2)),
      ingredients: selectedIngredients,
      details: details,
      selectedSize: isClassic ? size : null,
      isConfigured: true,
      name: isClassic ? `${product.name} (${size})` : product.name
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
          
          {/* SECCIÓN 1: TAMAÑO (Solo Pizzas Clásicas) */}
          {isClassic && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tamaño</h4>
              <div className="flex gap-2">
                <button onClick={() => setSize("Personal")} className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-all ${size === "Personal" ? "bg-amber-600 text-white shadow-md" : "bg-white"}`}>
                    Personal
                </button>
                <button onClick={() => setSize("Grande")} className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-all ${size === "Grande" ? "bg-amber-600 text-white shadow-md" : "bg-white"}`}>
                    Gigante (+${prices.sizeDifference.toFixed(2)})
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN 2: OPCIONES DEL COMBO (Dinámicas desde DB) */}
          {(comboOpts.hasSide || comboOpts.hasDrink) && (
            <div className="grid grid-cols-1 gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              {/* Selector de Acompañamiento */}
              {comboOpts.hasSide && comboOpts.sideChoices?.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <UtensilsCrossed size={12}/> {comboOpts.sideLabel || "Acompañamiento"}
                  </label>
                  <select 
                    className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500"
                    value={selectedSide}
                    onChange={(e) => setSelectedSide(e.target.value)}
                  >
                    {comboOpts.sideChoices.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {/* Selector de Bebida */}
              {comboOpts.hasDrink && comboOpts.drinkChoices?.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Wine size={12}/> {comboOpts.drinkLabel || "Bebida"}
                  </label>
                  <select 
                    className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500"
                    value={selectedDrink}
                    onChange={(e) => setSelectedDrink(e.target.value)}
                  >
                    {comboOpts.drinkChoices.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN 3: INGREDIENTES (Solo Pizzas) */}
          {isPizza && (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isClassic ? "Elige Ingredientes" : "Ingredientes Extra"}
                </h4>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  isClassic && selectedIngredients.length < 2 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {selectedIngredients.length} {isClassic ? '/ 2 Incluidos' : 'Seleccionados'}
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