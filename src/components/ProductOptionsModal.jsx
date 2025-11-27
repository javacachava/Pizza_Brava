import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { X, CheckSquare, Square, ChefHat, ChevronRight, UtensilsCrossed, Wine } from "lucide-react";

export default function ProductOptionsModal({ isOpen, product, onClose, onConfirm, globalConfig }) {
  if (!isOpen || !product || !globalConfig) return null;

  // Desempaquetamos la config global
  const { ingredients: ingredientsList, sides: sidesList, drinks: drinksList, rules } = globalConfig;
  
  // Configuración específica del producto (leída de su documento)
  const comboOpts = product.comboOptions || {};
  
  // Detectores
  const isClassic = product.pizzaType === "Clasica" || product.name.toLowerCase().includes("clásica");
  const isPizza = product.mainCategory === "Pizzas"; // Para mostrar ingredientes opcionales
  
  // Estados
  const [size, setSize] = useState("Personal");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [selectedSide, setSelectedSide] = useState("");
  const [selectedDrink, setSelectedDrink] = useState("");

  // Inicializar valores
  useEffect(() => {
    setSize("Personal");
    setSelectedIngredients([]);
    
    // Si el producto permite lados/bebidas, seleccionamos el primero por defecto o de su lista específica
    if (comboOpts.hasSide) {
        const availableSides = comboOpts.sideChoices?.length > 0 ? comboOpts.sideChoices : sidesList;
        if (availableSides.length > 0) setSelectedSide(availableSides[0]);
    }
    if (comboOpts.hasDrink) {
        const availableDrinks = comboOpts.drinkChoices?.length > 0 ? comboOpts.drinkChoices : drinksList;
        if (availableDrinks.length > 0) setSelectedDrink(availableDrinks[0]);
    }
  }, [product, sidesList, drinksList]);

  // Calcular Precios (Safe Math)
  const currentBasePrice = useMemo(() => {
    let price = product.price;
    // Sumar precio de tamaño solo si es Clásica
    if (isClassic && rules?.sizes?.[size]) {
      price += rules.sizes[size].priceModifier;
    }
    return price;
  }, [product, size, isClassic, rules]);

  const includedIng = isClassic ? (rules.includedIngredients || 2) : 0;
  const extraCount = Math.max(0, selectedIngredients.length - includedIng);
  const extraCost = extraCount * (rules.ingredientPrice || 0.75);
  const finalPrice = currentBasePrice + extraCost;

  const toggleIngredient = (ing) => {
    setSelectedIngredients(prev => 
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const handleConfirm = () => {
    // Validación
    if (isClassic && selectedIngredients.length < includedIng) {
        toast.error(`Elige al menos ${includedIng} ingredientes`);
        return;
    }

    // Construir detalles
    let details = [];
    if (isClassic) details.push(size);
    if (comboOpts.hasSide) details.push(`Entrada: ${selectedSide}`);
    if (comboOpts.hasDrink) details.push(`Bebida: ${selectedDrink}`);

    const cartItem = {
      ...product,
      cartItemId: `${product.id}-${Date.now()}`,
      price: Number(finalPrice.toFixed(2)),
      ingredients: selectedIngredients,
      details: details,
      selectedSize: isClassic ? size : null,
      isConfigured: true,
      // Nombre especial para el ticket
      name: isClassic ? `${product.name} (${size})` : product.name
    };

    onConfirm(cartItem);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ChefHat size={20} className="text-amber-400"/> 
            {product.name}
          </h3>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="p-5 bg-slate-50 flex-1 overflow-y-auto space-y-6">
          
          {/* 1. TAMAÑO (Solo Clásica) */}
          {isClassic && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tamaño</h4>
              <div className="flex gap-2">
                {rules.sizes && Object.keys(rules.sizes).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSize(key)}
                    className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-all ${
                      size === key ? "bg-amber-600 text-white shadow-md border-amber-700" : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {rules.sizes[key].label}
                    {rules.sizes[key].priceModifier > 0 && ` (+$${rules.sizes[key].priceModifier.toFixed(2)})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. COMBOS (Si aplica) */}
          {(comboOpts.hasSide || comboOpts.hasDrink) && (
            <div className="grid grid-cols-1 gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              {comboOpts.hasSide && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <UtensilsCrossed size={12}/> {comboOpts.sideLabel || "Acompañamiento"}
                  </label>
                  <select 
                    className="w-full p-2.5 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    value={selectedSide}
                    onChange={(e) => setSelectedSide(e.target.value)}
                  >
                    {(comboOpts.sideChoices?.length > 0 ? comboOpts.sideChoices : sidesList).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {comboOpts.hasDrink && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Wine size={12}/> {comboOpts.drinkLabel || "Bebida"}
                  </label>
                  <select 
                    className="w-full p-2.5 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    value={selectedDrink}
                    onChange={(e) => setSelectedDrink(e.target.value)}
                  >
                    {(comboOpts.drinkChoices?.length > 0 ? comboOpts.drinkChoices : drinksList).map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 3. INGREDIENTES (Pizzas Clásicas y Especialidades) */}
          {isPizza && (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isClassic ? "Ingredientes" : "Extras (Opcional)"}
                </h4>
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                  isClassic && selectedIngredients.length < includedIng ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {selectedIngredients.length} {isClassic ? `/ ${includedIng} Obligatorios` : 'Seleccionados'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {ingredientsList.map((ing) => {
                  const isSelected = selectedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      onClick={() => toggleIngredient(ing)}
                      className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg border text-left transition-all active:scale-95 ${
                        isSelected 
                        ? "bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected ? <CheckSquare size={16} className="text-green-600"/> : <Square size={16} className="text-slate-300"/>}
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
            <p className="text-xs text-slate-500">Precio Final</p>
            <p className="text-2xl font-bold text-slate-900">${finalPrice.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
             <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-500 font-bold hover:bg-slate-100">
                Cancelar
             </button>
             <button 
                onClick={handleConfirm}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2"
            >
                Agregar <ChevronRight size={18}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}