"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreHorizontal, X, Store, Megaphone, Star, Settings, Building2 } from "lucide-react";
import { SupportNavBadgeMobile } from "@/components/comercios/SupportNavBadge";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

// feat/feature-flags-ops (2026-05-13): los items "Paquetes" y "Publicidad"
// estan flag-gated. Si los flags estan OFF, el item NO aparece. Permite
// ocultar features experimentales/incompletas sin redeploy.
interface MoreItem {
    href: string;
    icon: typeof Store;
    label: string;
    /** Flag key requerido para mostrar este item. Si es undefined, siempre se muestra. */
    requiresFlag?: string;
}

const moreItems: MoreItem[] = [
    { href: "/comercios/mi-comercio", icon: Building2, label: "Mi Comercio" },
    { href: "/comercios/adquirir-paquetes", icon: Store, label: "Paquetes", requiresFlag: "merchant.paquetes" },
    { href: "/comercios/publicidad", icon: Megaphone, label: "Publicidad", requiresFlag: "merchant.publicidad" },
    { href: "/comercios/resenas", icon: Star, label: "Reseñas" },
    // Soporte handled separately
    { href: "/comercios/configuracion", icon: Settings, label: "Ajustes" },
];

export default function MobileMoreMenu() {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    // feat/feature-flags-ops: leer flags de la lista. Cualquier item que tenga
    // requiresFlag y el flag este OFF se filtra del menu.
    const { flags } = useFeatureFlags(["merchant.paquetes", "merchant.publicidad"]);
    const visibleItems = moreItems.filter(
        (item) => !item.requiresFlag || flags[item.requiresFlag as keyof typeof flags]
    );

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open]);

    return (
        <div className="relative flex flex-col items-center justify-center flex-1 h-full" ref={menuRef}>
            <button
                onClick={() => setOpen(!open)}
                className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors ${
                    open ? "text-blue-600" : "text-gray-400 hover:text-blue-600 active:text-blue-700"
                }`}
            >
                {open ? (
                    <X className="w-6 h-6 mb-0.5" />
                ) : (
                    <MoreHorizontal className="w-6 h-6 mb-0.5" />
                )}
                <span className="text-[10px] font-medium leading-tight">Más</span>
            </button>

            {/* Popup menu */}
            {open && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />

                    {/* Menu */}
                    <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="py-2">
                            {visibleItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            ))}
                            {/* Soporte with badge */}
                            <div onClick={() => setOpen(false)}>
                                <SupportNavBadgeMobile variant="menu" />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
