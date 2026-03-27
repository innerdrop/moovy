import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAnyRole, getUserRoles } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Settings,
    Store,
    LogOut,
    Menu,
    MessageCircle,
    DollarSign,
    Star,
    Megaphone,
} from "lucide-react";

import SupportNavBadge, { SupportNavBadgeMobile } from "@/components/comercios/SupportNavBadge";
import PortalSwitcher from "@/components/ui/PortalSwitcher";

export default async function ComerciosLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Security Check — use hasAnyRole (not legacy session.user.role)
    if (!session || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
        redirect("/comercios/login");
    }

    // AUDIT FIX 2.4: Verify merchant is approved before allowing portal access
    // Admins bypass this check
    if (!hasAnyRole(session, ["ADMIN"])) {
        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: (session.user as any).id },
            select: { approvalStatus: true },
        });

        if (!merchant) {
            redirect("/comercios/login");
        }

        if (merchant.approvalStatus !== "APPROVED") {
            redirect("/comercios/pendiente-aprobacion");
        }
    }

    const userRoles = getUserRoles(session);

    const navItems = [
        { href: "/comercios", icon: LayoutDashboard, label: "Inicio" },
        { href: "/comercios/pedidos", icon: ShoppingCart, label: "Pedidos" },
        { href: "/comercios/productos", icon: Package, label: "Productos" },
        { href: "/comercios/adquirir-paquetes", icon: Store, label: "Paquetes" },
        { href: "/comercios/pagos", icon: DollarSign, label: "Pagos" },
        { href: "/comercios/publicidad", icon: Megaphone, label: "Publicidad" },
        { href: "/comercios/resenas", icon: Star, label: "Reseñas" },
        // Soporte is handled separately via SupportNavBadge component
        { href: "/comercios/configuracion", icon: Settings, label: "Ajustes" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                            <Store className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">Comercio</h1>
                            <p className="text-xs text-gray-500">Panel de Control</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            // Insert Support before Configuration (last item)
                            if (item.href === "/comercios/configuracion") {
                                return (
                                    <React.Fragment key="support-wrapper">
                                        <li key="soporte-nav"><SupportNavBadge /></li>
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
                                            >
                                                <item.icon className="w-5 h-5" />
                                                {item.label}
                                            </Link>
                                        </li>
                                    </React.Fragment>
                                );
                            }
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition font-medium"
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Portal Switcher */}
                <div className="px-4 py-3 border-t border-gray-100">
                    <PortalSwitcher currentPortal="comercio" userRoles={userRoles} />
                </div>

                <div className="p-4 border-t border-gray-100">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {session.user?.name?.charAt(0) || "C"}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="font-medium text-sm truncate">{session.user?.name}</p>
                            <p className="text-xs text-gray-400">Comercio</p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <Link
                        href="/api/auth/signout"
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
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <Store className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-900">Comercio</span>
                    </div>
                    <Link href="/api/auth/signout" className="p-2 text-gray-500 hover:text-red-600">
                        <LogOut className="w-5 h-5" />
                    </Link>
                </div>
                {/* Mobile Portal Switcher */}
                <div className="mt-2 -mx-1">
                    <PortalSwitcher currentPortal="comercio" userRoles={userRoles} compact />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 pb-20 lg:p-8 overflow-y-auto">
                {children}
            </main>

            {/* Mobile Bottom Navigation - Identical to Client Style */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between h-16 px-2 max-w-md mx-auto relative text-center">
                    {navItems.map((item) => {
                        if (item.href === "/comercios/configuracion") {
                            return (
                                <React.Fragment key="support-mobile-wrapper">
                                    <SupportNavBadgeMobile key="soporte-nav-mobile" />
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-gray-400 hover:text-blue-600 active:text-blue-700 transition-colors"
                                    >
                                        <item.icon className="w-6 h-6 mb-0.5" />
                                        <span className="text-[10px] font-medium leading-tight">
                                            {item.label}
                                        </span>
                                    </Link>
                                </React.Fragment>
                            );
                        }
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center flex-1 h-full py-1 text-gray-400 hover:text-blue-600 active:text-blue-700 transition-colors"
                            >
                                <item.icon className="w-6 h-6 mb-0.5" />
                                <span className="text-[10px] font-medium leading-tight">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
                {/* Safe area padding for iPhones with notch */}
                <div className="h-[env(safe-area-inset-bottom)] bg-white" />
            </nav>

        </div>
    );
}