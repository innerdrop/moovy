// SizeSelector — Cards visuales para que el comerciante elija tamaño del producto
// Rama: feat/peso-volumen-productos
//
// Inspirado en Glovo/Cabify: en vez de tipear gramos, el comerciante elige
// una de 5 categorías con icono + descripción + ejemplos. Cada categoría mapea
// internamente a peso/volumen + vehículo recomendado (ver SIZE_METADATA en
// src/lib/product-weight.ts).
//
// El componente expone una API simple:
//   <SizeSelector value={selectedSize} onChange={setSize} disabled={loading} />
//
// El padre solo necesita guardar `selectedSize: ProductSize | null`. La
// derivación a weightGrams/volumeMl la hace el server action al guardar.

"use client";

import { Mail, ShoppingBag, Package, PackageOpen, Truck, Check } from "lucide-react";
import { ProductSize, SIZE_METADATA, SIZE_ORDER, SizeMetadata } from "@/lib/product-weight";

interface SizeSelectorProps {
    value: ProductSize | null;
    onChange: (size: ProductSize) => void;
    disabled?: boolean;
}

const ICON_MAP = {
    Mail,
    ShoppingBag,
    Package,
    PackageOpen,
    Truck,
};

function SizeCard({
    meta,
    selected,
    disabled,
    onClick,
}: {
    meta: SizeMetadata;
    selected: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    const Icon = ICON_MAP[meta.iconName];

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

            <h4 className="font-bold text-gray-900 text-sm leading-tight">{meta.displayName}</h4>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{meta.description}</p>

            <div className="mt-2 space-y-1">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{meta.weightRange}</p>
                <p className="text-[11px] text-gray-600 italic leading-snug">Ej: {meta.examples}</p>
            </div>
        </button>
    );
}

export default function SizeSelector({ value, onChange, disabled }: SizeSelectorProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {SIZE_ORDER.map((size) => {
                const meta = SIZE_METADATA[size];
                return (
                    <SizeCard
                        key={size}
                        meta={meta}
                        selected={value === size}
                        disabled={disabled}
                        onClick={() => onChange(size)}
                    />
                );
            })}
        </div>
    );
}
