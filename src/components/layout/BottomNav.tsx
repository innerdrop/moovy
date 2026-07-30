"use client";

// Bottom Navigation Component - Navegación optimizada para venta
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavPeak } from "@/lib/useNavPeak";
import {
    Home,
    Store,
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

    // rama feat/barras-flotantes-y-copy: mide el alto visual real de la píldora
    // (incluyendo el botón MOOVER, que sobresale por arriba) y lo publica para
    // que las barras de acción sepan a qué altura ponerse. Ver useNavPeak.
    const navRef = useRef<HTMLElement>(null);
    useNavPeak(navRef);

    // Rama fix/restaurar-moover-y-marketplace-sin-flags (2026-05-17):
    // Marketplace y MOOVER ahora son SIEMPRE visibles. Antes estaban
    // controlados por feature flags (buyer.marketplace, buyer.puntos-moover)
    // pero eso fue un over-reach del sistema de flags — esas secciones son
    // parte del producto y nunca deberían ocultarse desde OPS. Si en algún
    // momento se necesita pausar temporalmente Marketplace o Moover, se hace
    // con un flag dedicado y discutido, no por default.
    //
    // Navegación: Inicio | Marketplace | MOOVER (Centro) | Pedidos | Perfil
    const items: Array<{
        href: string;
        icon: typeof Home;
        label: string;
        isCenter?: boolean;
        isAction?: boolean;
    }> = [
        { href: "/", icon: Home, label: "Inicio" },
        { href: "/marketplace", icon: Store, label: "Marketplace" },
        { href: "/puntos", icon: Star, label: "MOOVER", isCenter: true },
        {
            href: isLoggedIn ? "/mis-pedidos" : "#",
            icon: Package,
            label: "Pedidos",
            isAction: !isLoggedIn,
        },
        {
            href: isLoggedIn ? "/mi-perfil" : "/login",
            icon: isLoggedIn ? User : LogIn,
            label: isLoggedIn ? "Perfil" : "Ingresar",
        },
    ];

    const handleNavClick = (e: React.MouseEvent, item: any) => {
        if (item.isAction) {
            e.preventDefault();
            setShowAuthModal(true);
            return;
        }
        // Si ya estamos en la misma página, scroll al inicio
        if (pathname === item.href || (item.href === "/" && pathname === "/")) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        closeCart();
    };

    return (
        <>
            {/* feat/rediseno-home: barra inferior como píldora flotante */}
            <nav
                ref={navRef}
                data-moovy-nav
                className="fixed left-1/2 -translate-x-1/2 z-50 max-w-[388px] bg-white/90 backdrop-blur-md border border-[#f0ece9] rounded-full shadow-[0_10px_32px_rgba(30,10,5,0.16)] lg:hidden"
                style={{
                    // Mismo token que las barras de acción, a propósito: si el
                    // colchón del sistema se mueve (Chrome 135+ lo hace al
                    // scrollear), se mueven las dos juntas y nunca se pisan.
                    bottom: 'var(--moovy-nav-offset)',
                    // El ancho también respeta los insets laterales: en horizontal
                    // con notch, izquierdo/derecho pasan a valer 44-47px y la
                    // píldora se metía debajo del recorte de la cámara.
                    width: 'calc(100% - 24px - var(--moovy-sal) - var(--moovy-sar))',
                }}
            >
                <div className="flex items-center justify-between h-[62px] relative px-2.5">
                    {items.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        // Central Button (MOOVER) — Orbe luminoso
                        if (item.isCenter) {
                            return (
                                <div key={item.href} className="flex-1 flex justify-center relative z-10">
                                    <Link
                                        href={item.href}
                                        onClick={(e) => handleNavClick(e, item)}
                                        // data-nav-peak: le avisa a useNavPeak que ESTE hijo
                                        // sobresale por encima de la caja de la píldora
                                        // (-top-3). Sin esta marca, la medición daría el alto
                                        // de la píldora y las barras le pasarían por encima al
                                        // botón rojo — que es exactamente el bug reportado.
                                        data-nav-peak
                                        className="relative -top-3 flex flex-col items-center group active:scale-95 transition-transform duration-150"
                                    >
                                        <div
                                            className={`
                                                w-14 h-14 rounded-full flex items-center justify-center relative transition-all duration-300
                                                bg-gradient-to-br from-[#e60012] to-[#cc000f]
                                                ${isLoggedIn ? "opacity-100" : "opacity-85"}
                                            `}
                                            style={{
                                                animation: isLoggedIn
                                                    ? 'moover-glow-pulse 2.5s ease-in-out infinite, moover-breathe 3s ease-in-out infinite'
                                                    : 'moover-glow-idle 4s ease-in-out infinite',
                                            }}
                                        >
                                            <Icon className={`w-7 h-7 text-white ${isLoggedIn ? "fill-current" : ""}`} />
                                        </div>
                                        <span className={`text-[10px] mt-1 font-bold ${isLoggedIn ? "text-[#e60012]" : "text-gray-400"}`}>
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
                                className={`flex flex-col items-center justify-center flex-1 h-full pb-1 transition-colors relative ${isActive ? "text-[#e60012]" : "text-gray-400 active:text-gray-600"
                                    }`}
                            >
                                <Icon className={`w-6 h-6 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                                <span className={`text-xs ${isActive ? "font-semibold" : ""}`}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <span className="absolute bottom-1 w-1 h-1 bg-[#e60012] rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
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
                        <p className="text-gray-500 mb-6 text-base">
                            Ingresá a tu cuenta para ver el estado de tus envíos en tiempo real y acceder a tu historial.
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/login"
                                className="block w-full bg-[#e60012] text-white font-bold py-3 rounded-xl hover:bg-[#cc000f] transition"
                                onClick={() => setShowAuthModal(false)}
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                href="/empezar"
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
                      