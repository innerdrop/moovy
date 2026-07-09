"use client";

// PriceRecargoField — precio del producto con dos modos de carga.
// Rama: feat/recargo-moovy-y-tamano-toggle
//
// Modo "Precio final": el comercio tipea directo lo que quiere cobrar en Moovy
// (comportamiento de siempre). Modo "Con recargo": tipea el precio de su LOCAL +
// un recargo %, y calculamos el precio final = base × (1 + recargo/100).
//
// La comisión SIEMPRE cae sobre el precio FINAL (regla canónica: valor de
// transacción). El desglose en vivo (final / comisión / recibís) evita la
// sensación de "doble cobro": el comercio ve exactamente qué recibe. En el
// primer mes la comisión es 0% y se luce.
//
// Este componente es autónomo: renderiza los hidden inputs que consume el server
// action (price, priceMode, basePrice, markupPercent) y le avisa al form padre el
// precio final (para validación) y cualquier cambio (para el dirty-state).

import { useState, useEffect, useRef } from "react";
import { Calculator, Tag } from "lucide-react";

export interface PriceRecargoState {
    mode: "direct" | "markup";
    price: string;
    basePrice: string;
    markupPercent: string;
    finalPrice: number;
}

interface PriceRecargoFieldProps {
    /** Rate de comisión efectivo en PORCENTAJE (ej: 10, 0 en primer mes). */
    commissionRate: number;
    /** Primer mes gratis: mostramos el 0% con copy especial. */
    firstMonthFree?: boolean;
    /** Rate que aplicará cuando termine el mes gratis (para el renglón "desde el mes 2"). */
    futureCommissionRate?: number;
    initialMode?: "direct" | "markup";
    initialPrice?: number | null;
    initialBasePrice?: number | null;
    initialMarkupPercent?: number | null;
    disabled?: boolean;
    error?: string;
    /** Se llama con el precio final cada vez que cambia (para validación del padre). */
    onFinalPriceChange?: (finalPrice: number) => void;
    /** Se llama con el estado completo en cada cambio (para dirty-state). */
    onStateChange?: (state: PriceRecargoState) => void;
}

function computeFinal(mode: "direct" | "markup", price: string, basePrice: string, markupPercent: string): number {
    if (mode === "markup") {
        const base = Number(basePrice);
        if (!base || base <= 0) return 0;
        const m = Number(markupPercent) || 0;
        return Math.round(base * (1 + m / 100));
    }
    return Number(price) > 0 ? Number(price) : 0;
}

export default function PriceRecargoField({
    commissionRate,
    firstMonthFree,
    futureCommissionRate,
    initialMode,
    initialPrice,
    initialBasePrice,
    initialMarkupPercent,
    disabled,
    error,
    onFinalPriceChange,
    onStateChange,
}: PriceRecargoFieldProps) {
    // Arranque: si viene con basePrice (edit de un producto con recargo) → modo markup.
    const startMode: "direct" | "markup" =
        initialMode ?? (initialBasePrice && initialBasePrice > 0 ? "markup" : "direct");

    const [mode, setMode] = useState<"direct" | "markup">(startMode);
    const [price, setPrice] = useState<string>(
        initialPrice && initialPrice > 0 && startMode === "direct" ? String(initialPrice) : ""
    );
    const [basePrice, setBasePrice] = useState<string>(
        initialBasePrice && initialBasePrice > 0 ? String(initialBasePrice) : ""
    );
    const [markupPercent, setMarkupPercent] = useState<string>(
        initialMarkupPercent !== null && initialMarkupPercent !== undefined ? String(initialMarkupPercent) : ""
    );

    const finalPrice = computeFinal(mode, price, basePrice, markupPercent);

    // Avisar al padre (precio final para validación + estado para dirty).
    const onFinalRef = useRef(onFinalPriceChange);
    onFinalRef.current = onFinalPriceChange;
    const onStateRef = useRef(onStateChange);
    onStateRef.current = onStateChange;
    useEffect(() => {
        onFinalRef.current?.(finalPrice);
        onStateRef.current?.({ mode, price, basePrice, markupPercent, finalPrice });
    }, [mode, price, basePrice, markupPercent, finalPrice]);

    const commission = Math.round((finalPrice * commissionRate) / 100);
    const payout = finalPrice - commission;

    // Renglón "desde el mes 2": qué recibiría cuando termine el mes gratis.
    const futureRate = futureCommissionRate ?? 0;
    const futurePayout = finalPrice - Math.round((finalPrice * futureRate) / 100);

    // Cambio de modo con autocompletado. Al pasar a "Con recargo", si el precio del
    // local está vacío lo sembramos con el precio final que ya venía cargado (el que
    // tipeó a mano o el que importó de su base). Al volver a "Precio final", si está
    // vacío lo sembramos con el final calculado. Siempre editable.
    const switchToMarkup = () => {
        if (mode === "markup") return;
        setMode("markup");
        if (!basePrice.trim() && price.trim() && Number(price) > 0) setBasePrice(price.trim());
    };
    const switchToDirect = () => {
        if (mode === "direct") return;
        setMode("direct");
        if (!price.trim() && finalPrice > 0) setPrice(String(finalPrice));
    };

    const fmt = (n: number) => `$${n.toLocaleString("es-AR")}`;

    const inputBase = `w-full bg-gray-50 border ${
        error ? "border-red-400 bg-red-50/30 ring-2 ring-red-400/20" : "border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
    } focus:bg-white p-4 rounded-xl transition-all font-bold text-gray-900 outline-none shadow-sm placeholder:text-gray-300`;

    return (
        <div className="space-y-4">
            {/* Selector de modo */}
            <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={switchToDirect}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                        mode === "direct" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <Tag className="w-3.5 h-3.5" />
                    Precio final
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={switchToMarkup}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                        mode === "markup" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <Calculator className="w-3.5 h-3.5" />
                    Con recargo
                </button>
            </div>

            {mode === "direct" ? (
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                        Precio de Venta <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            className={`${inputBase} pl-9`}
                            disabled={disabled}
                            onWheel={(e) => e.currentTarget.blur()}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 ml-1">Lo que el cliente paga en Moovy.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                            Precio en tu local <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                className={`${inputBase} pl-9`}
                                disabled={disabled}
                                onWheel={(e) => e.currentTarget.blur()}
                                value={basePrice}
                                onChange={(e) => setBasePrice(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Lo que cobrás en tu mostrador.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                            Recargo Moovy (%)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="0"
                                className={`${inputBase} pr-9`}
                                disabled={disabled}
                                onWheel={(e) => e.currentTarget.blur()}
                                value={markupPercent}
                                onChange={(e) => setMarkupPercent(e.target.value)}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Extra sobre tu precio de local.</p>
                    </div>
                </div>
            )}

            {/* Desglose en vivo — transparencia total, mata la sensación de "doble cobro". */}
            {finalPrice > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/40 border border-gray-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">Precio final en Moovy</span>
                        <span className="font-black text-gray-900">{fmt(finalPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">
                            Comisión Moovy ({commissionRate}%)
                            {firstMonthFree && <span className="text-emerald-600 font-bold ml-1">· primer mes gratis</span>}
                        </span>
                        <span className="font-bold text-gray-400">{commission > 0 ? `–${fmt(commission)}` : fmt(0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200/70">
                        <span className="text-gray-700 font-bold">Vos recibís</span>
                        <span className="font-black text-emerald-600 text-base">{fmt(payout)}</span>
                    </div>
                    {/* Aviso a futuro: qué recibiría cuando termine el mes gratis. */}
                    {firstMonthFree && futureRate > 0 && (
                        <p className="text-[11px] text-gray-400 pt-1">
                            Desde el mes 2 (comisión {futureRate}%): recibirías {fmt(futurePayout)}
                        </p>
                    )}
                </div>
            )}

            {error && <p className="text-xs text-red-500 font-semibold ml-1">{error}</p>}

            {/* Hidden inputs para el server action. En modo directo, base/markup van
                vacíos → el server los guarda como null (sin metadata de recargo). */}
            <input type="hidden" name="priceMode" value={mode} />
            <input type="hidden" name="price" value={finalPrice > 0 ? String(finalPrice) : ""} />
            <input type="hidden" name="basePrice" value={mode === "markup" ? basePrice : ""} />
            <input type="hidden" name="markupPercent" value={mode === "markup" ? markupPercent : ""} />
        </div>
    );
}
