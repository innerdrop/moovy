"use client";

/**
 * SearchableSelect — combobox con buscador, navegación por teclado, y
 * escape hatch "Otra" para valores custom.
 *
 * Uso típico: selects cascading en registro de repartidor (vehicleType,
 * marca, modelo, año, color). Reemplaza los grids de botones y selects
 * estáticos por una experiencia más sutil y escalable.
 *
 * Props:
 *   - options: string[]          — lista completa (se filtra on-the-fly por búsqueda)
 *   - value: string              — valor actual seleccionado
 *   - onChange: (v: string) => void
 *   - placeholder?: string
 *   - disabled?: boolean         — ej: Modelo bloqueado hasta elegir Marca
 *   - disabledReason?: string    — tooltip cuando está disabled
 *   - icon?: LucideIcon          — ícono opcional en el trigger
 *   - label?: string             — label accesible
 *   - required?: boolean
 *   - allowCustom?: boolean      — habilita input libre al elegir "Otra"/"Otro"
 *   - customPlaceholder?: string — placeholder del input custom
 *   - emptyMessage?: string      — cuando filtro no devuelve resultados
 *   - searchPlaceholder?: string
 *
 * Accesibilidad:
 *   - role="combobox" + aria-expanded + aria-controls
 *   - aria-activedescendant para highlight durante navegación
 *   - Teclado: ↑↓ navega, Enter selecciona, Esc cierra, Tab cierra sin seleccionar
 *   - Click fuera cierra.
 *
 * Tema: verde-600 consistente con el portal driver.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    disabledReason?: string;
    icon?: LucideIcon;
    label?: string;
    required?: boolean;
    allowCustom?: boolean;
    customPlaceholder?: string;
    emptyMessage?: string;
    searchPlaceholder?: string;
    /** Para cerrar la UI custom desde afuera si el parent resetea */
    id?: string;
    className?: string;
}

/** Genera un id estable por instancia para aria-activedescendant */
let __seq = 0;
function useSelectId(id?: string): string {
    const ref = useRef<string>(id || `searchable-${++__seq}`);
    return ref.current;
}

const OTRA_LABELS = new Set(["Otra", "Otro", "Otra marca", "Otro modelo", "Otro color"]);

function isOtraOption(opt: string): boolean {
    return OTRA_LABELS.has(opt.trim());
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Seleccionar...",
    disabled = false,
    disabledReason,
    icon: Icon,
    label,
    required,
    allowCustom = false,
    customPlaceholder = "Escribí el valor...",
    emptyMessage = "Sin resultados",
    searchPlaceholder = "Buscar...",
    id,
    className = "",
}: SearchableSelectProps) {
    const instanceId = useSelectId(id);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);
    const [customMode, setCustomMode] = useState(false);

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const searchRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLUListElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);

    // Detectar si el value actual NO está en options → modo custom activo
    useEffect(() => {
        if (!value) {
            setCustomMode(false);
            return;
        }
        if (allowCustom && !options.includes(value)) {
            setCustomMode(true);
        } else {
            setCustomMode(false);
        }
    }, [value, options, allowCustom]);

    // Filtro case-insensitive; "Otra"/"Otro" siempre queda al final si matchea
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((opt) => opt.toLowerCase().includes(q));
    }, [options, query]);

    // Reset highlight cuando cambia el filtro
    useEffect(() => {
        setActiveIdx(0);
    }, [query, open]);

    // Click fuera
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Autofocus del buscador al abrir
    useEffect(() => {
        if (open && searchRef.current) {
            const t = setTimeout(() => searchRef.current?.focus(), 30);
            return () => clearTimeout(t);
        }
    }, [open]);

    // Scroll al item activo
    useEffect(() => {
        if (!open || !listRef.current) return;
        const el = listRef.current.querySelector<HTMLLIElement>(
            `[data-idx="${activeIdx}"]`
        );
        if (el) {
            el.scrollIntoView({ block: "nearest" });
        }
    }, [activeIdx, open]);

    function handleSelect(opt: string) {
        if (isOtraOption(opt) && allowCustom) {
            setCustomMode(true);
            onChange("");
            setOpen(false);
            setQuery("");
            // Foco al input custom después del render
            setTimeout(() => {
                const input = rootRef.current?.querySelector<HTMLInputElement>(
                    `input[data-custom-input="${instanceId}"]`
                );
                input?.focus();
            }, 40);
            return;
        }
        onChange(opt);
        setOpen(false);
        setQuery("");
        triggerRef.current?.focus();
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[activeIdx]) {
                handleSelect(filtered[activeIdx]);
            }
            return;
        }
        if (e.key === "Tab") {
            setOpen(false);
            return;
        }
    }

    function clearCustom() {
        setCustomMode(false);
        onChange("");
    }

    const displayValue = value || "";
    const isOpenReal = open && !disabled;

    // Modo custom: input libre con botón X para volver al select
    if (customMode && allowCustom) {
        return (
            <div ref={rootRef} className={`relative ${className}`}>
                {label ? (
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {label}
                        {required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                ) : null}
                <div className="relative">
                    {Icon ? (
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    ) : null}
                    <input
                        type="text"
                        value={value}
                        data-custom-input={instanceId}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={customPlaceholder}
                        className={`w-full ${Icon ? "pl-9" : "pl-3"} pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition`}
                    />
                    <button
                        type="button"
                        onClick={clearCustom}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-gray-500"
                        aria-label="Cambiar selección"
                        title="Elegir otra opción del listado"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            {label ? (
                <label
                    htmlFor={`${instanceId}-trigger`}
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            ) : null}

            <button
                ref={triggerRef}
                id={`${instanceId}-trigger`}
                type="button"
                role="combobox"
                aria-expanded={isOpenReal}
                aria-haspopup="listbox"
                aria-controls={`${instanceId}-list`}
                aria-activedescendant={
                    isOpenReal && filtered[activeIdx]
                        ? `${instanceId}-opt-${activeIdx}`
                        : undefined
                }
                disabled={disabled}
                title={disabled && disabledReason ? disabledReason : undefined}
                onClick={() => setOpen((o) => !o)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm transition ${
                    disabled
                        ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                        : isOpenReal
                            ? "border-green-500 ring-2 ring-green-100 bg-white"
                            : "border-gray-300 hover:border-gray-400 bg-white"
                }`}
            >
                {Icon ? <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" /> : null}
                <span
                    className={`flex-1 text-left truncate ${
                        displayValue ? "text-gray-900" : "text-gray-400"
                    }`}
                >
                    {displayValue || placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${
                        isOpenReal ? "rotate-180" : ""
                    }`}
                />
            </button>

            {isOpenReal && (
                <div className="absolute z-40 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>
                    <ul
                        ref={listRef}
                        id={`${instanceId}-list`}
                        role="listbox"
                        className="max-h-64 overflow-y-auto py-1"
                    >
                        {filtered.length === 0 ? (
                            <li className="px-3 py-3 text-sm text-gray-500 text-center">
                                {emptyMessage}
                            </li>
                        ) : (
                            filtered.map((opt, idx) => {
                                const selected = opt === value;
                                const active = idx === activeIdx;
                                const isOtra = isOtraOption(opt);
                                return (
                                    <li
                                        key={opt}
                                        id={`${instanceId}-opt-${idx}`}
                                        data-idx={idx}
                                        role="option"
                                        aria-selected={selected}
                                        onMouseEnter={() => setActiveIdx(idx)}
                                        onClick={() => handleSelect(opt)}
                                        className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition ${
                                            active
                                                ? "bg-green-50 text-green-900"
                                                : "text-gray-700 hover:bg-gray-50"
                                        } ${
                                            isOtra ? "border-t border-gray-100 mt-1 pt-2 italic" : ""
                                        }`}
                                    >
                                        <span className="truncate">{opt}</span>
                                        {selected ? (
                                            <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                                        ) : null}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
