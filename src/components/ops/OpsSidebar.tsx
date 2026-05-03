"use client";

import { useState, useEffect } from "react";
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
    Archive,
    Upload,
    Mail,
    BookOpen,
    Radio,
    Megaphone,
    Star,
    ClipboardList,
    MapPin,
    FileText,
    Send,
    Filter,
    GitBranch,
    Wallet,
    ClipboardCheck,
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
            { href: "/ops/dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/ops/live", icon: Radio, label: "En Vivo", badge: "live-indicator" },
            { href: "/ops/pedidos", icon: ShoppingCart, label: "Pedidos" },
            { href: "/ops/soporte", icon: MessageCircle, label: "Soporte" },
            { href: "/ops/fraude", icon: Shield, label: "Fraude" },
            { href: "/ops/auditoria", icon: FileText, label: "Auditoría" },
        ],
    },
    {
        title: "Actores",
        items: [
            { href: "/ops/usuarios", icon: Users, label: "Usuarios" },
            { href: "/ops/pipeline-comercios", icon: GitBranch, label: "Pipeline Comercios" },
        ],
    },
    {
        title: "CRM",
        items: [
            { href: "/ops/segmentos", icon: Filter, label: "Segmentos" },
            { href: "/ops/broadcast", icon: Send, label: "Broadcast" },
        ],
    },
    {
        title: "Catálogo",
        items: [
            { href: "/ops/productos", icon: Store, label: "Productos" },
            { href: "/ops/moderacion", icon: Shield, label: "Moderación" },
            { href: "/ops/categorias", icon: Tag, label: "Categorías" },
            { href: "/ops/import-productos", icon: Upload, label: "Importar" },
        ],
    },
    {
        title: "Marketing",
        items: [
            { href: "/ops/solicitudes-ads", icon: ClipboardList, label: "Solicitudes Ads" },
            { href: "/ops/hero", icon: ImageIcon, label: "Hero Banners" },
            { href: "/ops/banner-promo", icon: Megaphone, label: "Banner Promo" },
            { href: "/ops/destacados", icon: Star, label: "Destacados" },
        ],
    },
    {
        title: "Paquetes B2B",
        items: [
            { href: "/ops/catalogo-paquetes", icon: Package, label: "Catálogo" },
            { href: "/ops/precios-paquetes", icon: DollarSign, label: "Precios" },
            { href: "/ops/ventas-paquetes", icon: Package, label: "Ventas" },
        ],
    },
    {
        title: "Finanzas",
        items: [
            { href: "/ops/config-biblia", icon: BookOpen, label: "Biblia Financiera" },
            { href: "/ops/revenue", icon: TrendingUp, label: "Revenue" },
            { href: "/ops/comisiones", icon: DollarSign, label: "Comisiones" },
            { href: "/ops/lealtad-comercios", icon: Gift, label: "Lealtad" },
            { href: "/ops/pagos-pendientes", icon: Wallet, label: "Pagos Pendientes" },
        ],
    },
    {
        title: "Sistema",
        items: [
            { href: "/ops/analytics", icon: BarChart3, label: "Analytics" },
            { href: "/ops/configuracion", icon: Settings, label: "Configuración" },
            { href: "/ops/configuracion-logistica", icon: Truck, label: "Logística" },
            { href: "/ops/zonas-excluidas", icon: MapPin, label: "Zonas Excluidas" },
            { href: "/ops/zonas-delivery", icon: MapPin, label: "Zonas Delivery" },
            { href: "/ops/backups", icon: Archive, label: "Backups" },
            { href: "/ops/emails", icon: Mail, label: "Emails" },
            { href: "/ops/playbook", icon: ClipboardCheck, label: "Playbook" },
            { href: "/ops/crons", icon: Activity, label: "Crons" },
        ],
    },
];

// Bottom nav for mobile - most important items
const mobileNavItems = [
    { href: "/ops/dashboard", icon: LayoutDashboard, label: "Inicio" },
    { href: "/ops/pedidos", icon: ShoppingCart, label: "Pedidos" },
    { href: "/ops/live", icon: Activity, label: "Live" },
    { href: "/ops/usuarios", icon: Users, label: "Usuarios" },
];

export default function OpsSidebar({ userName }: OpsSidebarProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [activeOrders, setActiveOrders] = useState(0);

    // Poll active orders every 15s for live indicator
    useEffect(() => {
        const fetchActive = () => {
            fetch("/api/admin/active-orders")
                .then(r => r.json())
                .then(d => setActiveOrders(d.count || 0))
                .catch(() => {});
        };
        fetchActive();
        const interval = setInterval(fetchActive, 15000);
        return () => clearInterval(interval);
    }, []);

    const closeMobileMenu = () => setIsMobileOpen(false);

    const isActive = (href: string) => {
        if (href === "/ops/dashboard") {
            return pathname === "/ops/dashboard" || pathname === "/ops";
        }
        // Match exacto o con sub-ruta (ej: /ops/comercios/123)
        // Evita que /ops/hero pinte /ops/hero-builder también
        return pathname === href || pathname.startsWith(href + "/");
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
                <Link href="/ops/dashboard" className="flex items-center gap-2">
                    <Image src="/logo-moovy-white.svg" alt="Moovy" width={280} height={90} className="h-6 w-auto" />
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
                    <Link href="/ops/dashboard" className="flex items-center gap-3" onClick={closeMobileMenu}>
                        <Image src="/logo-moovy-white.svg" alt="Moovy" width={280} height={90} className="h-7 w-auto" />
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
                        <div className="w-9 h-9 rounded-full bg-[#e60012] flex items-center justify-center text-sm font-bold">
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
                                            {item.badge === "live-indicator" ? (
                                                <span className="ml-auto">
                                                    {activeOrders > 0 ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                                                            </span>
                                                            <span className="text-[10px] font-medium text-green-400">{activeOrders}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex h-2 w-2 rounded-full bg-slate-600" />
                                                    )}
                                                </span>
                                            ) : item.badge ? (
                                                <span className="ml-auto text-xs">{item.badge}</span>
                                            ) : null}
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
