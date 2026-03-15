"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    X,
    Building2,
    MessageCircle,
    DollarSign,
    Image as ImageIcon,
    UserCheck,
    Shield,
    TrendingUp,
    Archive
} from "lucide-react";

interface OpsSidebarProps {
    userName?: string;
}

interface NavSection {
    title: string;
    items: { href: string; icon: any; label: string; badge?: string }[];
}

const navSections: NavSection[] = [
    {
        title: "Operaciones",
        items: [
            { href: "/ops", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/ops/live", icon: Activity, label: "En Vivo", badge: "🔴" },
            { href: "/ops/pedidos", icon: ShoppingCart, label: "Pedidos" },
            { href: "/ops/soporte", icon: MessageCircle, label: "Soporte" },
        ],
    },
    {
        title: "Actores",
        items: [
            { href: "/ops/comercios", icon: Building2, label: "Comercios" },
            { href: "/ops/repartidores", icon: Truck, label: "Repartidores" },
            { href: "/ops/vendedores", icon: UserCheck, label: "Vendedores" },
            { href: "/ops/clientes", icon: Users, label: "Clientes" },
        ],
    },
    {
        title: "Catálogo",
        items: [
            { href: "/ops/productos", icon: Store, label: "Productos" },
            { href: "/ops/moderacion", icon: Shield, label: "Moderación" },
            { href: "/ops/categorias", icon: Tag, label: "Categorías" },
            { href: "/ops/catalogo-paquetes", icon: Package, label: "Paquetes" },
            { href: "/ops/slides", icon: ImageIcon, label: "Hero Slider" },
        ],
    },
    {
        title: "Finanzas",
        items: [
            { href: "/ops/revenue", icon: TrendingUp, label: "Revenue" },
            { href: "/ops/comisiones", icon: DollarSign, label: "Comisiones" },
            { href: "/ops/puntos", icon: Gift, label: "Puntos" },
        ],
    },
    {
        title: "Sistema",
        items: [
            { href: "/ops/analytics", icon: BarChart3, label: "Analytics" },
            { href: "/ops/configuracion", icon: Settings, label: "Configuración" },
            { href: "/ops/configuracion-logistica", icon: Truck, label: "Logística" },
            { href: "/ops/backups", icon: Archive, label: "Backups" },
        ],
    },
];

// Bottom nav for mobile - most important items
const mobileNavItems = [
    { href: "/ops", icon: LayoutDashboard, label: "Inicio" },
    { href: "/ops/pedidos", icon: ShoppingCart, label: "Pedidos" },
    { href: "/ops/live", icon: Activity, label: "Live" },
    { href: "/ops/comercios", icon: Building2, label: "Comercios" },
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
            {/* Mobile Header Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-lg">
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition"
                    aria-label="Abrir menú"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <Link href="/ops" className="flex items-center gap-2">
                    <Image src="/logo-moovy.png" alt="Moovy" width={80} height={26} className="w-auto h-auto" />
                    <span className="text-xs font-medium text-slate-400">Admin</span>
                </Link>
                <div className="w-10" /> {/* Spacer for balance */}
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800">
                <div className="flex items-center justify-around py-2">
                    {mobileNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${isActive(item.href)
                                ? "text-red-500"
                                : "text-slate-400 hover:text-white"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    ))}
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-slate-400 hover:text-white transition"
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Más</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/70 z-50"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar - Full for desktop, Drawer for mobile */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    w-64 bg-slate-900 text-white flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <Link href="/ops" className="flex items-center gap-3" onClick={closeMobileMenu}>
                        <Image src="/logo-moovy.png" alt="Moovy" width={100} height={32} className="w-auto h-auto" />
                    </Link>
                    <button
                        onClick={closeMobileMenu}
                        className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                        aria-label="Cerrar menú"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User Info - Top */}
                <div className="px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-sm font-bold">
                            {userName?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{userName || "Admin"}</p>
                            <p className="text-xs text-slate-400">Administrador</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 overflow-y-auto">
                    {navSections.map((section, sIdx) => (
                        <div key={section.title} className={sIdx > 0 ? "mt-4" : ""}>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
                                {section.title}
                            </p>
                            <ul className="space-y-0.5">
                                {section.items.map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={closeMobileMenu}
                                            className={`
                                                flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
                                                ${isActive(item.href)
                                                    ? "bg-red-500/10 text-red-500 font-medium"
                                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                                }
                                            `}
                                        >
                                            <item.icon className="w-4 h-4 flex-shrink-0" />
                                            <span>{item.label}</span>
                                            {item.badge && (
                                                <span className="ml-auto text-xs">{item.badge}</span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-slate-800 space-y-1">
                    <Link
                        href="/"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                        <Store className="w-5 h-5" />
                        Ir a la Tienda
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: "/ops/login" })}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
}
