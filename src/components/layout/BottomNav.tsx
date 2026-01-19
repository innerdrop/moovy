"use client";

// Bottom Navigation Component - Navegación optimizada para venta
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Search,
    Star,
    User,
    Package,
    LogIn
} from "lucide-react";
import { useCartStore } from "@/store/cart";

interface BottomNavProps {
    isLoggedIn?: boolean;
}

export default function BottomNav({ isLoggedIn = false }: BottomNavProps) {
    const pathname = usePathname();
    const closeCart = useCartStore((state) => state.closeCart);

    const [showAuthModal, setShowAuthModal] = useState(false);

    // Navegación: Inicio | Buscar | MOOVER (Centro) | Pedidos | Perfil
    const items = [
        { href: "/tienda", icon: Home, label: "Inicio" },
        { href: "/productos", icon: Search, label: "Buscar" },
        {
            href: "/puntos",
            icon: Star,
            label: "MOOVER",
            isCenter: true
        },
        {
            href: isLoggedIn ? "/mis-pedidos" : "#",
            icon: Package,
            label: "Pedidos",
            isAction: !isLoggedIn // Flag to trigger custom action instead of link
        },
        {
            href: isLoggedIn ? "/mi-perfil" : "/login",
            icon: isLoggedIn ? User : LogIn,
            label: isLoggedIn ? "Perfil" : "Ingresar"
        },
    ];

    const handleNavClick = (e: React.MouseEvent, item: any) => {
        if (item.isAction) {
            e.preventDefault();
            setShowAuthModal(true);
            return;
        }
        closeCart();
    };

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-end justify-between h-16 max-w-lg mx-auto relative px-2">
                    {items.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        // Central Button (MOOVER)
                        if (item.isCenter) {
                            return (
                                <div key={item.href} className="flex-1 flex justify-center relative z-10">
                                    <Link
                                        href={item.href}
                                        onClick={(e) => handleNavClick(e, item)}
                                        className="relative -top-3 flex flex-col items-center group"
                                    >
                                        {/* Sparkle stars when logged in */}
                                        {isLoggedIn && (
                                            <>
                                                <span className="absolute -top-1 -left-1 text-amber-400 animate-pulse" style={{ animationDelay: '0s' }}>✦</span>
                                                <span className="absolute -top-1 -right-1 text-amber-300 animate-pulse" style={{ animationDelay: '0.3s' }}>✧</span>
                                                <span className="absolute top-3 -left-3 text-yellow-400 animate-pulse" style={{ animationDelay: '0.6s' }}>✦</span>
                                                <span className="absolute top-3 -right-3 text-amber-400 animate-pulse" style={{ animationDelay: '0.9s' }}>✧</span>
                                            </>
                                        )}

                                        {/* Breathing pulse animation */}
                                        <span className={`absolute w-14 h-14 rounded-full animate-pulse ${isLoggedIn ? 'bg-amber-400/30' : 'bg-red-400/30'}`} />

                                        <div className={`
                                            w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 relative
                                            ${isLoggedIn
                                                ? "bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/40"
                                                : "bg-gradient-to-br from-[#e60012] to-[#ff3333] shadow-red-500/40"
                                            }
                                        `}>
                                            {/* White star - bigger */}
                                            <Icon className="w-8 h-8 text-white fill-current" />
                                        </div>
                                        <span className={`text-[10px] mt-1 font-bold ${isLoggedIn ? "text-amber-500" : "text-[#e60012]"}`}>
                                            {item.label}
                                        </span>
                                    </Link>
                                </div>
                            );
                        }

                        // Standard Items
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={(e) => handleNavClick(e, item)}
                                className={`flex flex-col items-center justify-center flex-1 h-full pb-1 transition-colors ${isActive ? "text-[#e60012]" : "text-gray-400 active:text-gray-600"
                                    }`}
                            >
                                <Icon className={`w-6 h-6 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                                <span className={`text-[10px] ${isActive ? "font-semibold" : ""}`}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <span className="absolute bottom-1 w-1 h-1 bg-[#e60012] rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Safe area padding */}
                <div className="h-[env(safe-area-inset-bottom)]" />
            </nav>
            {/* Auth Required Modal */}
            {showAuthModal && (
                <div
                    className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setShowAuthModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-[#e60012]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Seguí tus pedidos</h3>
                        <p className="text-gray-500 mb-6 text-sm">
                            Ingresá a tu cuenta para ver el estado de tus envíos en tiempo real y acceder a tu historial.
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/login"
                                className="block w-full bg-[#e60012] text-white font-bold py-3 rounded-xl hover:bg-[#c4000f] transition"
                                onClick={() => setShowAuthModal(false)}
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                href="/registro"
                                className="block w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
                                onClick={() => setShowAuthModal(false)}
                            >
                                Crear Cuenta
                            </Link>
                        </div>
                        <button
                            onClick={() => setShowAuthModal(false)}
                            className="mt-4 text-gray-400 text-sm hover:text-gray-600"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
