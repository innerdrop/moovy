// SizeSelector — Cards visuales para que el comerciante elija tamaño del producto
// Rama: feat/tamanos-producto-desde-ops (antes: feat/peso-volumen-productos)
//
// Inspirado en Glovo/Cabify: en vez de tipear gramos, el comerciante elige
// una categoría con icono + descripción + ejemplos. Cada categoría mapea a
// peso/volumen + vehículo mínimo.
//
// CAMBIO CLAVE: las opciones YA NO están hardcodeadas. Vienen por prop desde el
// server (getMerchantSizeOptions en src/lib/product-sizes.ts), que las deriva de
// la config de OPS (PackageCategory). Así el rango de peso y el vehículo que ve
// el comercio coinciden 1:1 con lo que está configurado en OPS.
//
//   <SizeSelector options={sizeOptions} value={selectedSize} onChange={...} />

"use client";

import { Mail, ShoppingBag, Package, PackageOpen, Truck, Check, Bike } from "lucide-react";
import type { MerchantSizeOption } from "@/lib/product-weight";

interface SizeSelectorProps {
    options: MerchantSizeOption[];
    value: string | null;
    onChange: (option: MerchantSizeOption) => void;
    disabled?: boolean;
}

const ICON_MAP = {
    Mail,
    ShoppingBag,
    Package,
    PackageOpen,
    Truck,
} as const;

function SizeCard({
    option,
    selected,
    disabled,
    onClick,
}: {
    option: MerchantSizeOption;
    selected: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    const Icon = ICON_MAP[option.iconName] ?? Package;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-pressed={selected}
            className={`relative flex flex-col items-start text-left p-4 rounded-2xl border-2 transition-all ${
                selected
                    ? "bg-blue-50 border-blue-500 shadow-md"
                    : "bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
        >
            {selected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
            )}

            <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    selected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                }`}
            >
                <Icon className="w-5 h-5" />
            </div>

            <h4 className="font-bold text-gray-900 text-sm leading-tight">{option.displayName}</h4>
            {option.description && (
                <p className="text-xs text-gray-500 font-medium mt-0.5">{option.description}</p>
            )}

            <div className="mt-2 space-y-1">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{option.weightRange}</p>
                {option.examples && (
                    <p className="text-[11px] text-gray-600 italic leading-snug">Ej: {option.examples}</p>
                )}
            </div>

            {/* Vehículo mínimo — sale de OPS. Le muestra al comercio la consecuencia
                logística de su elección ("esto lo lleva una moto"). */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                <Bike className="w-3.5 h-3.5" />
                <span>Se entrega en: {option.vehicleLabel}</span>
            </div>
        </button>
    );
}

export default function SizeSelector({ options, value, onChange, disabled }: SizeSelectorProps) {
    if (options.length === 0) {
        // Defensivo: OPS sin categorías activas. No rompemos el alta — el producto
        // se puede crear sin tamaño (cae al fallback conservador del motor).
        return (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3">
                No hay tamaños configurados todavía. Podés publicar el producto igual; el equipo de Moovy
                asignará el vehículo por defecto.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {options.map((option) => (
                <SizeCard
                    key={option.size}
                    option={option}
                    selected={value === option.size}
                    disabled={disabled}
                    onClick={() => onChange(option)}
                />
            ))}
        </div>
    );
}
