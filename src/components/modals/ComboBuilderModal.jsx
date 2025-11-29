import React, { useMemo, useState } from "react";
import { X, ChevronRight, AlertCircle, Pizza } from "lucide-react";
import { useComboLogic } from "../../hooks/useComboLogic";
import PizzaBuilderModal from "./PizzaBuilderModal";

/**
 * Selector genérico para slots tipo side / drink
 */
const SlotSelector = ({
  slot,
  options,
  currentSelection,
  onSelect,
}) => {
  return (
    <div className="mb-4 border border-slate-800/70 rounded-2xl p-4 bg-slate-900/60">
      <h4 className="font-bold text-slate-200 mb-2 uppercase text-[11px] tracking-[0.2em]">
        {slot.label}
      </h4>

      {options.length === 0 ? (
        <p className="text-xs text-red-400 flex items-center gap-2">
          <AlertCircle size={14} />
          No hay opciones disponibles para este componente.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((opt) => {
            const extra = Math.max(
              0,
              (opt.price || 0) - (slot.includedPrice || 0)
            );
            const isSelected = currentSelection?.product?.id === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => onSelect(opt)}
                className={[
                  "w-full text-left px-3 py-2 rounded-xl border text-sm transition-all",
                  "border-slate-700 bg-slate-900/80 hover:border-orange-500 hover:bg-slate-900",
                  isSelected && "border-orange-500 bg-orange-500/10",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="font-semibold text-slate-100 truncate">
                  {opt.name}
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between mt-1">
                  <span>${(opt.price || 0).toFixed(2)}</span>
                  {extra > 0 && (
                    <span className="text-orange-400 font-semibold">
                      +${extra.toFixed(2)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {currentSelection && (slot.type === "side" || slot.type === "drink") && (
        <p className="text-[11px] text-emerald-400 mt-2">
          Seleccionado:{" "}
          <span className="font-semibold">
            {currentSelection.product?.name}
          </span>
        </p>
      )}
    </div>
  );
};

export default function ComboBuilderModal({
  combo,
  ingredients = [],
  sides = [],
  drinks = [],
  potatoes = [],
  sauces = [],
  globalRules,
  onClose,
  onConfirm,
}) {
  const [openPizzaSlot, setOpenPizzaSlot] = useState(null);

  // Normalizamos la configuración del combo para la lógica
  const comboConfig = useMemo(() => {
    if (!combo) return null;

    const basePrice =
      typeof combo.basePrice === "number"
        ? combo.basePrice
        : typeof combo.price === "number"
        ? combo.price
        : 0;

    const slots = (combo.slots || []).map((slot, idx) => ({
      id: slot.id ?? `slot_${idx}`,
      label: slot.label || `Elemento ${idx + 1}`,
      type: slot.type || "side",
      includedPrice: Number(slot.includedPrice || 0),
      allowedOptions: slot.allowedOptions || [],
    }));

    return { basePrice, slots };
  }, [combo]);

  const { handleSelectSlot, calculation } = useComboLogic(
    comboConfig || { basePrice: 0, slots: [] }
  );

  if (!comboConfig) return null;

  const { basePrice, totalExtras, finalPrice, isValid, breakdown, selections } =
    calculation;

  // Opciones según tipo de slot
  const getOptionsForSlot = (slot) => {
    if (slot.type === "side") {
      if (!sides) return [];
      if (slot.allowedOptions?.length) {
        return sides.filter((s) => slot.allowedOptions.includes(s.id));
      }
      return sides;
    }

    if (slot.type === "drink") {
      if (!drinks) return [];
      if (slot.allowedOptions?.length) {
        return drinks.filter((d) => slot.allowedOptions.includes(d.id));
      }
      return drinks;
    }

    // Para pizza_classic no hay "lista" de opciones, se abre un sub-modal
    return [];
  };

  const handleFinish = () => {
    if (!isValid) return;

    const details = comboConfig.slots.map((slot) => {
      const sel = selections[slot.id];
      if (!sel) return `${slot.label}: [Sin seleccionar]`;

      if (slot.type === "side" || slot.type === "drink") {
        return `${slot.label}: ${sel.product?.name || "-"}`;
      }

      if (slot.type === "pizza_classic") {
        return `${slot.label}: ${sel.details || "Pizza personalizada"}`;
      }

      return `${slot.label}: -`;
    });

    const finalItem = {
      id: combo.id,
      name: combo.name,
      mainCategory: combo.mainCategory || "Combos",
      station: combo.station || "cocina",
      price: Number(finalPrice.toFixed(2)),
      details,
      isConfigured: true,
    };

    onConfirm(finalItem);
  };

  const REQUIRED_PIZZA_ING =
    globalRules?.rules?.classic_required_ingredients ?? 2;

  return (
    <>
      {/* MODAL PRINCIPAL DEL COMBO */}
      <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4">
        <div className="bg-slate-950 border border-slate-800 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div>
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/20 text-orange-400">
                  <Pizza size={16} />
                </span>
                {combo.name}
              </h2>
              {combo.description && (
                <p className="text-xs text-slate-400 mt-1">
                  {combo.description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full p-2 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* CONTENIDO */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* LADO IZQUIERDO: SLOTS */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.25em] mb-2">
                Componentes del combo
              </p>

              {comboConfig.slots.length === 0 && (
                <div className="text-sm text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-yellow-400" />
                  Este combo no tiene slots configurados aún.
                </div>
              )}

              {comboConfig.slots.map((slot) => {
                const currentSelection = selections[slot.id];

                // Slot de PIZZA CLÁSICA: usa sub-modal de PizzaBuilderModal
                if (slot.type === "pizza_classic") {
                  return (
                    <div
                      key={slot.id}
                      className="mb-4 border border-slate-800/70 rounded-2xl p-4 bg-slate-900/60"
                    >
                      <h4 className="font-bold text-slate-200 mb-1 uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                        {slot.label}
                        <span className="text-[10px] text-slate-500 normal-case">
                          (Pizza clásica – {REQUIRED_PIZZA_ING} ing. incluidos)
                        </span>
                      </h4>

                      {currentSelection ? (
                        <p className="text-[12px] text-slate-300 mt-1">
                          {currentSelection.details ||
                            "Pizza configurada correctamente."}
                        </p>
                      ) : (
                        <p className="text-[12px] text-slate-500 mt-1">
                          Aún no has configurado esta pizza.
                        </p>
                      )}

                      <button
                        onClick={() => setOpenPizzaSlot(slot)}
                        className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/70 text-orange-100 text-xs font-bold uppercase tracking-wide hover:bg-orange-500/20 transition-colors"
                      >
                        Configurar Pizza
                        <ChevronRight size={14} />
                      </button>

                      {typeof slot.includedPrice === "number" &&
                        slot.includedPrice > 0 && (
                          <p className="text-[11px] text-slate-500 mt-2">
                            El precio base de la pizza ya está incluido en el
                            combo. Solo se cobrará extra por ingredientes
                            adicionales.
                          </p>
                        )}
                    </div>
                  );
                }

                // Slots side / drink usan selector genérico
                const options = getOptionsForSlot(slot);
                return (
                  <SlotSelector
                    key={slot.id}
                    slot={slot}
                    options={options}
                    currentSelection={currentSelection}
                    onSelect={(opt) =>
                      handleSelectSlot(slot.id, { product: opt })
                    }
                  />
                );
              })}
            </div>

            {/* LADO DERECHO: RESUMEN */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950/90 p-4 md:p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.25em]">
                  Resumen
                </h3>

                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Precio base</span>
                    <span className="font-semibold text-slate-100">
                      ${basePrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-slate-800 my-2" />

                  {breakdown.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      No hay cargos extra. Puedes configurar pizzas o cambiar
                      complementos para ver los ajustes de precio.
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {breakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-[12px] text-slate-300"
                        >
                          <span>{item.name}</span>
                          <span className="text-orange-400 font-semibold">
                            +${item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {!isValid && (
                  <p className="text-[11px] text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Completa todas las opciones del combo antes de confirmar.
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase text-slate-500 tracking-[0.25em]">
                      Total Combo
                    </p>
                    <p className="text-2xl font-black text-white">
                      ${finalPrice.toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={handleFinish}
                    disabled={!isValid}
                    className={[
                      "inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold uppercase tracking-wide transition-all",
                      isValid
                        ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/40 hover:scale-105"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {isValid ? (
                      <>
                        Confirmar Combo
                        <ChevronRight size={14} />
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} />
                        Incompleto
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-MODAL PARA PIZZA CLÁSICA DENTRO DEL COMBO */}
      {openPizzaSlot && (
        <PizzaBuilderModal
          product={{
            id: `${combo.id}_slot_${openPizzaSlot.id}`,
            name: openPizzaSlot.label || "Pizza del combo",
            price: 0, // El precio base ya está en el combo; aquí solo nos interesan los extras
          }}
          ingredients={ingredients}
          globalConfig={globalRules}
          onClose={() => setOpenPizzaSlot(null)}
          onConfirm={(pizzaItem) => {
            const extraCost =
              pizzaItem?.configuration?.extraCost ??
              pizzaItem?.extraIngredientsCost ??
              0;

            const detailsText = Array.isArray(pizzaItem?.details)
              ? pizzaItem.details.join(", ")
              : pizzaItem?.details || "Pizza personalizada";

            handleSelectSlot(openPizzaSlot.id, {
              extraIngredientsCost: extraCost,
              details: detailsText,
            });

            setOpenPizzaSlot(null);
          }}
        />
      )}
    </>
  );
}
