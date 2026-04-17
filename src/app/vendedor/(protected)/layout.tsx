import React from "react";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/auth-utils";
import { requireSellerAccess } from "@/lib/roles";
import Link from "next/link";
import {
    LayoutDashboard,
    Tag,
    ShoppingCart,
    DollarSign,
    Settings,
    LogOut,
    Store,
    Star,
} from "lucide-react";
import PortalSwitcher from "@/components/ui/PortalSwitcher";
import SellerMobileMoreMenu from "@/components/seller/SellerMobileMoreMenu";
import { MessageCircle } from "lucide-react";

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    // Gate canónico: verifica sesión → no archivado → no suspendido →
    // seller profile registrado → activo → no suspendido. Admin bypass incluido.
    // Ver src/lib/roles.ts.
    await requireSellerAccess(userId);

    // Si llegamos acá, el gate pasó y session es non-null.
    const authedSession = session!;
    const userRoles = getUserRoles(authedSession);

    const navItems = [
        { href: "/vendedor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/vendedor/listings", icon: Tag, label: "Mis Listings" },
        { href: "/vendedor/pedidos", icon: ShoppingCart, label: "Mis Ventas" },
        { href: "/vendedor/ganancias", icon: DollarSign, label: "Ganancias" },
        { href: "/vendedor/resenas", icon: Star, label: "Reseñas" },
        { href: "/vendedor/soporte", icon: MessageCircle, label: "Soporte" },
        { href: "/vendedor/configuracion", icon: Settings, label: "Configuración" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                            <Store className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">Vendedor</h1>
                            <p className="text-xs text-gray-500">Panel de Ventas</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition font-medium"
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Portal Switcher */}
                <div className="px-4 py-3 border-t border-gray-100">
                    <PortalSwitcher currentPortal="vendedor" userRoles={userRoles} />
                </div>

                <div className="p-4 border-t border-gray-100">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                            {authedSession.user?.name?.charAt(0) || "V"}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="font-medium text-sm truncate">{authedSession.user?.name}</p>
                            <p className="text-xs text-gray-400">Vendedor</p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <Link
                        href="/logout"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition text-sm font-medium w-full"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </Link>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                            <Store className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-900">Vendedor</span>
                    </div>
                    <Link href="/logout" className="p-2 text-gray-500 hover:text-red-600">
                        <LogOut className="w-5 h-5" />
                    </Link>
                </div>
                {/* Mobile Portal Switcher */}
                <div className="mt-2 -mx-1">
                    <PortalSwitcher currentPortal="vendedor" userRoles={userRoles} compact />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 pb-20 lg:p-8 overflow-y-auto">
                {children}
            </main>

            {/* Mobile Bottom Navigation — 4 main items + More menu */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between h-16 px-2 max-w-md mx-auto relative text-center">
                    {navItems.slice(0, 4).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-gray-400 hover:text-emerald-600 active:text-emerald-700 transition-colors"
                        >
                            <item.icon className="w-6 h-6 mb-0.5" />
                            <span className="text-[10px] font-medium leading-tight">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                    {/* More menu for remaining items (Reseñas, Soporte, Configuración) */}
                    <SellerMobileMoreMenu />
                </div>
                {/* Safe area padding for iPhones with notch */}
                <div className="h-[env(safe-area-inset-bottom)] bg-white" />
            </nav>
        </div>
    );
}
