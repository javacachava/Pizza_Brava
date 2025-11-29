// src/components/modals/HamburgerModal.jsx
import React, { useMemo, useState } from "react";
import { X, Check } from "lucide-react";
import { toast } from "react-hot-toast";

export default function HamburgerModal({
  product,
  potatoes = [],
  sauces = [],
  onClose,
  onConfirm
}) {
  if (!product) return null;

  // =========================
  // 1. ESTADO LOCAL
  // =========================

  const [selectedPotatoId, setSelectedPotatoId] = useState(() => {
    if (!potatoes || potatoes.length === 0) return null;
    const defaultPotato = potatoes.find((p) => p.isDefault);
    return (defaultPotato || potatoes[0]).id;
  });

  const [selectedSauceIds, setSelectedSauceIds] = useState([]);

  const selectedPotato = useMemo(
    () => potatoes.find((p) => p.id === selectedPotatoId) || null,
    [potatoes, selectedPotatoId]
  );

  const selectedSauces = useMemo(
    () => sauces.filter((s) => selectedSauceIds.includes(s.id)),
    [sauces, selectedSauceIds]
  );

  // =========================
  // 2. LÓGICA DE PRECIOS
  // =========================

  const BASE_PRICE = Number(product.price || 0);

  // Regla:
  // - Si la hamburguesa incluye papas (product.includesFries === true):
  //    -> el precio base ya incluye "unas" papas normales.
  //    -> si eliges una papa "premium", se cobra solo el upgrade (extraPrice).
  // - Si NO incluye papas:
  //    -> se cobra el precio completo de la papa seleccionada (price o extraPrice).
  //
  // Estructura esperada en cada potato:
  // { id, name, price?, extraPrice?, isDefault?, active?, stock? }

  const EXTRA_SAUCE_FALLBACK = 0.5; // Si la salsa no trae precio

  const friesExtraCost = useMemo(() => {
    if (!selectedPotato) return 0;

    const rawPrice =
      selectedPotato.extraPrice ?? selectedPotato.price ?? 0;

    if (product.includesFries) {
      // Solo cobramos el upgrade si hay extraPrice
      return Number((selectedPotato.extraPrice ?? 0).toFixed(2));
    }

    // No incluye papas: cobramos el precio completo de las papas
    return Number(rawPrice.toFixed(2));
  }, [selectedPotato, product.includesFries]);

  // Salsas:
  // Cada salsa puede traer: { price?, extraPrice? }
  const saucesExtraCost = useMemo(() => {
    if (!selectedSauces.length) return 0;

    const total = selectedSauces.reduce((sum, s) => {
      const price =
        s.extraPrice ?? s.price ?? EXTRA_SAUCE_FALLBACK;
      return sum + Number(price || 0);
    }, 0);

    return Number(total.toFixed(2));
  }, [selectedSauces]);

  const totalPrice = useMemo(
    () => Number((BASE_PRICE + friesExtraCost + saucesExtraCost).toFixed(2)),
    [BASE_PRICE, friesExtraCost, saucesExtraCost]
  );

  // =========================
  // 3. HANDLERS
  // =========================

  const handleToggleSauce = (id) => {
    setSelectedSauceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const details = [];

    if (selectedPotato) {
      details.push(`Papas: ${selectedPotato.name}`);
    } else if (product.includesFries) {
      details.push("Papas: (incluidas por defecto)");
    }

    if (selectedSauces.length > 0) {
      details.push(
        `Salsas: ${selectedSauces.map((s) => s.name || "Salsa").join(", ")}`
      );
    }

    if (!details.length) {
      details.push("Sin extras");
    }

    const itemName = product.name;

    const cartItem = {
      id: product.id,
      cartItemId: `${product.id}_hamb_${Date.now()}`,
      name: itemName,
      price: totalPrice,
      qty: 1,
      mainCategory: product.mainCategory || "Hamburguesas",
      details,
      // Componentes desglosados (útil para inventario)
      components: {
        potato: selectedPotato
          ? { id: selectedPotato.id, name: selectedPotato.name }
          : null,
        sauces: selectedSauces.map((s) => ({
          id: s.id,
          name: s.name
        }))
      }
    };

    if (totalPrice <= 0) {
      toast.error("Precio inválido para la hamburguesa.");
      return;
    }

    onConfirm(cartItem);
  };

  // =========================
  // 4. RENDER
  // =========================

  const activePotatoes =
    potatoes?.filter(
      (p) => (p.active ?? true) && (p.stock ?? 1) > 0
    ) || [];

  const activeSauces =
    sauces?.filter(
      (s) => (s.active ?? true) && (s.stock ?? 1) > 0
    ) || [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 text-slate-100 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-400/80">
              CONFIGURAR HAMBURGUESA
            </p>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              {product.name}
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                {product.mainCategory || "Hamburguesas"}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-700/70 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex flex-col md:flex-row gap-6 p-6 md:p-7">
          {/* Columna izquierda: papas */}
          <div className="w-full md:w-1/2 space-y-4">
            <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                Tipo de papas
              </p>

              {activePotatoes.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No hay tipos de papas configurados o disponibles.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activePotatoes.map((p) => {
                    const isSelected = p.id === selectedPotatoId;
                    const upgradePrice = product.includesFries
                      ? p.extraPrice ?? 0
                      : p.extraPrice ?? p.price ?? 0;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPotatoId(p.id)}
                        className={`relative p-3 rounded-xl border text-left text-sm transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-500/15 text-orange-50 shadow-md shadow-orange-900/40"
                            : "border-slate-700 bg-slate-900/80 text-slate-200 hover:border-orange-500/50 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            {product.includesFries ? (
                              <p className="text-[11px] text-slate-400">
                                {upgradePrice > 0
                                  ? `Upgrade +$${upgradePrice.toFixed(2)}`
                                  : "Incluidas sin costo extra"}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400">
                                {upgradePrice > 0
                                  ? `$${upgradePrice.toFixed(2)}`
                                  : "Sin costo extra"}
                              </p>
                            )}
                            {typeof p.stock === "number" && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                Stock: {p.stock}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <span className="shrink-0 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!product.includesFries && (
                <p className="mt-3 text-[11px] text-slate-500">
                  Esta hamburguesa no incluye papas; se cobrará el costo
                  completo del tipo de papas seleccionado.
                </p>
              )}
            </div>
          </div>

          {/* Columna derecha: salsas */}
          <div className="w-full md:w-1/2 space-y-4">
            <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                Salsas
              </p>

              {activeSauces.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No hay salsas configuradas o disponibles.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {activeSauces.map((s) => {
                    const active = selectedSauceIds.includes(s.id);
                    const price =
                      s.extraPrice ?? s.price ?? EXTRA_SAUCE_FALLBACK;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleToggleSauce(s.id)}
                        className={`p-3 rounded-xl border text-left text-xs md:text-sm transition-all ${
                          active
                            ? "border-orange-500 bg-orange-500/15 text-orange-50 shadow-md shadow-orange-900/40"
                            : "border-slate-700 bg-slate-900/80 text-slate-200 hover:border-orange-500/50 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-semibold truncate">
                              {s.name || "Salsa"}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Extra: ${Number(price).toFixed(2)}
                            </p>
                            {typeof s.stock === "number" && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                Stock: {s.stock}
                              </p>
                            )}
                          </div>
                          {active && (
                            <span className="shrink-0 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="mt-3 text-[11px] text-slate-500">
                Puedes seleccionar múltiples salsas; cada una suma su costo
                extra al total.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Total hamburguesa
            </p>
            <p className="text-2xl font-black text-orange-300">
              ${totalPrice.toFixed(2)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-lg shadow-orange-900/40 hover:from-orange-500 hover:to-red-400 active:scale-95 transition-transform"
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
