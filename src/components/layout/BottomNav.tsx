"use client";

// Bottom Navigation Component - Navegación inferior estilo app
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Search,
    Package,
    Star,
    User,
    LogIn
} from "lucide-react";
import { useCartStore } from "@/store/cart";

interface BottomNavProps {
    cartCount?: number;
    isLoggedIn?: boolean;
}

export default function BottomNav({ isLoggedIn = false }: BottomNavProps) {
    const pathname = usePathname();
    const closeCart = useCartStore((state) => state.closeCart);

    // Navegación: Inicio, Explorar, Pedidos, MOOVER, Perfil/Ingresar
    const navItems = [
        { href: "/", icon: Home, label: "Inicio" },
        { href: "/productos", icon: Search, label: "Explorar" },
        { href: "/mis-pedidos", icon: Package, label: "Pedidos" },
        { href: "/puntos", icon: Star, label: "MOOVER" },
        // Último item cambia según si está logueado
        isLoggedIn
            ? { href: "/mi-perfil", icon: User, label: "Perfil" }
            : { href: "/login", icon: LogIn, label: "Ingresar" }
    ];

    const handleNavClick = () => {
        // Close cart when navigating
        closeCart();
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${isActive ? "text-[#e60012]" : "text-gray-400 active:text-gray-600"
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : ""}`} />
                            <span className={`text-[10px] mt-0.5 ${isActive ? "font-semibold" : ""}`}>
                                {item.label}
                            </span>

                            {/* Active dot indicator */}
                            {isActive && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#e60012] rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Safe area padding for notched phones */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
