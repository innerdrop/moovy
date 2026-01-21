"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Truck,
    Settings,
    BarChart3,
    LogOut,
    Menu,
    Store,
    Tag,
    Gift,
    Activity,
    X
} from "lucide-react";

interface OpsSidebarProps {
    userName?: string;
}

const navItems = [
    { href: "/ops", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/ops/live", icon: Activity, label: "🔴 En Vivo" },
    { href: "/ops/productos", icon: Package, label: "Productos" },
    { href: "/ops/categorias", icon: Tag, label: "Categorías" },
    { href: "/ops/pedidos", icon: ShoppingCart, label: "Pedidos" },
    { href: "/ops/repartidores", icon: Truck, label: "Repartidores" },
    { href: "/ops/clientes", icon: Users, label: "Clientes" },
    { href: "/ops/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/ops/puntos", icon: Gift, label: "Sistema Puntos" },
    { href: "/ops/configuracion", icon: Settings, label: "Configuración" },
];

export default function OpsSidebar({ userName }: OpsSidebarProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const closeMobileMenu = () => setIsMobileOpen(false);

    const isActive = (href: string) => {
        if (href === "/ops") {
            return pathname === "/ops";
        }
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile Menu Button - Fixed */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-navy text-white rounded-xl shadow-lg hover:bg-navy/90 transition"
                aria-label="Abrir menú"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    w-72 bg-navy text-white flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <Link href="/ops" className="flex items-center gap-3" onClick={closeMobileMenu}>
                        <Store className="w-8 h-8 text-moovy" />
                        <div>
                            <h1 className="font-script text-xl text-moovy">Moovy</h1>
                            <p className="text-xs text-gray-400">Panel Admin</p>
                        </div>
                    </Link>
                    {/* Close button - mobile only */}
                    <button
                        onClick={closeMobileMenu}
                        className="lg:hidden p-2 text-gray-400 hover:text-white transition"
                        aria-label="Cerrar menú"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={closeMobileMenu}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                        ${isActive(item.href)
                                            ? "bg-moovy text-navy font-semibold shadow-lg"
                                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                                        }
                                    `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User Info & Actions */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-moovy flex items-center justify-center">
                            <span className="font-bold text-navy">
                                {userName?.charAt(0)?.toUpperCase() || "A"}
                            </span>
                        </div>
                        <div>
                            <p className="font-medium text-sm">{userName || "Admin"}</p>
                            <p className="text-xs text-gray-400">Administrador</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Link
                            href="/"
                            onClick={closeMobileMenu}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition px-2 py-2 rounded-lg hover:bg-white/5"
                        >
                            <Store className="w-4 h-4" />
                            Ir a la Tienda
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: "/ops/login" })}
                            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition w-full px-2 py-2 rounded-lg hover:bg-white/5"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
