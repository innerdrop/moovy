"use client";

// Barra "Entregar en" bajo el header (feat/direcciones-limite-y-chip-header).
//
// Patrón estándar de apps de delivery: una barra fina, ancho completo, con la
// dirección de entrega activa ("Entregar en: Av. Maipú 263 ▾"). Tocarla abre
// un selector con las direcciones guardadas; elegir una la marca como
// principal (isDefault) vía PATCH — el checkout preselecciona la principal,
// así todo queda consistente.
//
// Se monta en el layout de la tienda DENTRO del contenido scrolleable (no en
// el header fijo): así no hay que recalcular el padding-top global y la barra
// acompaña el scroll, como en las apps grandes.
//
// Mismo espíritu que PointsBalanceChip: UN fetch al montar, y se auto-oculta
// si el usuario no tiene direcciones o si el fetch falla (nunca una barra rota).

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

export default function DeliveryAddressBar() {
    const [addresses, setAddresses] = useState<AddressItem[] | null>(null);
    const [open, setOpen] = useState(false);
    const [switchingId, setSwitchingId] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/profile/addresses")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!cancelled && Array.isArray(d)) setAddresses(d);
            })
            .catch(() => {
                /* silent: la barra simplemente no aparece si falla */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Cerrar al clickear afuera.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    // Oculta mientras carga, si falló, o si no hay direcciones guardadas.
    if (!addresses || addresses.length === 0) return null;

    const active = addresses.find((a) => a.isDefault) ?? addresses[0];

    const selectAddress = async (addr: AddressItem) => {
        if (addr.id === active.id || switchingId) {
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
                setAddresses(
                    addresses.map((a) => ({ ...a, isDefault: a.id === addr.id }))
                );
            }
        } catch {
            /* silent: si falla, la barra queda como estaba */
        } finally {
            setSwitchingId(null);
            setOpen(false);
        }
    };

    return (
        <div ref={rootRef} className="relative bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 lg:px-6">
                <button
                    onClick={() => setOpen((v) => !v)}
                    aria-label={`Dirección de entrega: ${formatAddressShort(active)}. Tocá para cambiarla`}
                    aria-expanded={open}
                    className="flex items-center gap-1.5 h-10 w-full text-left active:opacity-70 transition"
                    title="Cambiar dirección de entrega"
                >
                    <MapPin className="w-4 h-4 text-[#e60012] flex-shrink-0" />
                    <span className="text-xs text-gray-500 flex-shrink-0">Entregar en:</span>
                    <span className="text-xs font-bold text-gray-900 truncate">
                        {formatAddressShort(active)}
                    </span>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </button>
            </div>

            {open && (
                <div className="absolute top-full left-4 lg:left-6 mt-1 w-80 max-w-[90vw] bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[70]">
                    <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Entregar en
                    </p>
                    <ul>
                        {addresses.map((addr) => {
                            const isActive = addr.id === active.id;
                            return (
                                <li key={addr.id}>
                                    <button
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
                                            isActive && (
                                                <CheckCircle className="w-4 h-4 text-[#e60012] flex-shrink-0" />
                                            )
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
