"use client";

// Chip "Entregar en" del header (feat/direcciones-limite-y-chip-header).
//
// Patrón estándar de apps de delivery: la dirección de entrega activa siempre
// a la vista. Tocarla abre un dropdown con las direcciones guardadas; elegir
// una la marca como principal (isDefault) vía PATCH — el checkout ya
// preselecciona la principal, así todo queda consistente.
//
// Mismo espíritu que PointsBalanceChip: solo se monta para logueados (lo
// decide AppHeader), UN fetch al montar, y se auto-oculta si el usuario no
// tiene direcciones o si el fetch falla (nunca un chip roto en el header).

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

export default function DeliveryAddressChip({
    align = "left",
}: {
    /** De qué lado se ancla el dropdown (según dónde esté montado el chip). */
    align?: "left" | "right";
}) {
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
                /* silent: el chip simplemente no aparece si falla */
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

    // Oculto mientras carga, si falló, o si no hay direcciones guardadas.
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
            /* silent: si falla, el chip queda como estaba */
        } finally {
            setSwitchingId(null);
            setOpen(false);
        }
    };

    return (
        <div ref={rootRef} className="relative min-w-0">
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={`Dirección de entrega: ${formatAddressShort(active)}. Tocá para cambiarla`}
                aria-expanded={open}
                className="flex items-center gap-1 h-9 px-2 rounded-full hover:bg-gray-50 text-gray-700 transition active:scale-95 min-w-0 max-w-[34vw] sm:max-w-[220px]"
                title="Cambiar dirección de entrega"
            >
                <MapPin className="w-4 h-4 text-[#e60012] flex-shrink-0" />
                <span className="text-xs font-semibold truncate">
                    {formatAddressShort(active)}
                </span>
                <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div
                    className={`absolute top-full mt-2 w-72 max-w-[88vw] bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[70] ${align === "right" ? "right-0" : "left-0"}`}
                >
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
