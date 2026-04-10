"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreHorizontal, X, Star, MessageCircle, Settings } from "lucide-react";

const moreItems = [
    { href: "/vendedor/resenas", icon: Star, label: "Reseñas" },
    { href: "/vendedor/soporte", icon: MessageCircle, label: "Soporte" },
    { href: "/vendedor/configuracion", icon: Settings, label: "Configuración" },
];

export default function SellerMobileMoreMenu() {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
                    open ? "text-emerald-600" : "text-gray-400 hover:text-emerald-600 active:text-emerald-700"
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
                            {moreItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}