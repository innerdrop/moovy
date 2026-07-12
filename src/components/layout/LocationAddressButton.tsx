"use client";

// Botón de ubicación del header (pill "Ushuaia") con la función de elegir dirección
// de entrega. Reemplaza a la vieja barra blanca "Entregar en" (DeliveryAddressBar):
// ahora la selección de dirección vive en el pill de arriba a la izquierda.
//
// - Trae las direcciones guardadas (/api/profile/addresses). Un fetch al montar.
// - Muestra la dirección activa (o "Ushuaia" si no hay ninguna).
// - Al tocar: dropdown con las direcciones para cambiar la principal (PATCH isDefault)
//   + link a administrar. Si no hay direcciones, es un pill estático (sin dropdown).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, ChevronDown, CheckCircle, Loader2 } from "lucide-react";
import { formatAddressShort } from "@/lib/addresses";

type AddressItem = {
    id: string;
    label: string;
    street: string;
    number: string;
    isDefault: boolean;
};

interface Props {
    isHomepage?: boolean;
    isMarketplace?: boolean;
}

export default function LocationAddressButton({ isHomepage, isMarketplace }: Props) {
    const [addresses, setAddresses] = useState<AddressItem[] | null>(null);
    const [open, setOpen] = useState(false);
    const [switchingId, setSwitchingId] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/profile/addresses")
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => {
                // Siempre resolvemos a un array: deslogueado (401) o error → [] → muestra
                // "Ushuaia" (nunca queda tildado en el skeleton de carga).
                if (!cancelled) setAddresses(Array.isArray(d) ? d : []);
            })
            .catch(() => {
                if (!cancelled) setAddresses([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    const hasAddresses = !!addresses && addresses.length > 0;
    const active = hasAddresses ? (addresses!.find((a) => a.isDefault) ?? addresses![0]) : null;
    const label = active ? formatAddressShort(active) : "Ushuaia";

    // Estilos del pill según contexto. Home (rojo) y marketplace (violeta) tienen
    // header de color → pill blanco. El resto, gris.
    const onColor = isHomepage || isMarketplace;
    const pillClass = onColor
        ? "text-white bg-white/15 rounded-full pl-2.5 pr-2 py-1.5"
        : "text-gray-600";
    const iconClass = onColor ? "text-white" : "text-[#e60012]";
    const chevClass = onColor ? "text-white/70" : "text-gray-400";

    const selectAddress = async (addr: AddressItem) => {
        if (!active || addr.id === active.id || switchingId) {
            setOpen(false);
            return;
        }
        setSwitchingId(addr.id);
        try {
            const res = await fetch(`/api/profile/addresses/${addr.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDefault: true }),
            });
            if (res.ok) {
                setAddresses(addresses!.map((a) => ({ ...a, isDefault: a.id === addr.id })));
            }
        } catch {
            /* silent */
        } finally {
            setSwitchingId(null);
            setOpen(false);
        }
    };

    // Mientras carga: skeleton (evita el flash de "Ushuaia" antes de la dirección).
    if (addresses === null) {
        return (
            <div className={`flex items-center gap-1.5 ${pillClass}`}>
                <MapPin className={`w-4 h-4 ${iconClass}`} />
                <span className={`h-3 w-14 rounded animate-pulse ${onColor ? "bg-white/30" : "bg-gray-200"}`} />
            </div>
        );
    }

    // Sin direcciones guardadas → pill estático (la ciudad como default). SIN chevron:
    // no hay dropdown ni opciones que mostrar, la flecha sería engañosa.
    if (!hasAddresses) {
        return (
            <div className={`flex items-center gap-1 ${pillClass}`}>
                <MapPin className={`w-4 h-4 ${iconClass}`} />
                <span className="text-sm font-semibold">Ushuaia</span>
            </div>
        );
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label={`Entregar en ${label}. Tocá para cambiar la dirección`}
                className={`flex items-center gap-1 max-w-[120px] ${pillClass} active:opacity-80 transition`}
            >
                <MapPin className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
                <span className="text-sm font-semibold truncate">{label}</span>
                <ChevronDown
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${chevClass} ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 w-72 max-w-[86vw] bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[70]">
                    <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Entregar en
                    </p>
                    <ul>
                        {addresses!.map((addr) => {
                            const isActive = !!active && addr.id === active.id;
                            return (
                                <li key={addr.id}>
                                    <button
                                        type="button"
                                        onClick={() => selectAddress(addr)}
                                        disabled={switchingId !== null}
                                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${isActive ? "bg-red-50/60" : "hover:bg-gray-50"}`}
                                    >
                                        <MapPin
                                            className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#e60012]" : "text-gray-300"}`}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-gray-900 truncate">
                                                {addr.label}
                                            </span>
                                            <span className="block text-xs text-gray-500 truncate">
                                                {formatAddressShort(addr)}
                                            </span>
                                        </span>
                                        {switchingId === addr.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-[#e60012] flex-shrink-0" />
                                        ) : (
                                            isActive && <CheckCircle className="w-4 h-4 text-[#e60012] flex-shrink-0" />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <Link
                        href="/mi-perfil/direcciones"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-3 text-center text-sm font-semibold text-[#e60012] bg-gray-50 hover:bg-gray-100 transition border-t border-gray-100"
                    >
                        Administrar direcciones
                    </Link>
                </div>
            )}
        </div>
    );
}
