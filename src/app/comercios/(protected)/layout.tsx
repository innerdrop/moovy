import React from "react";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/auth-utils";
import { requireMerchantAccess } from "@/lib/roles";
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Store,
    LogOut,
    Menu,
    MessageCircle,
    DollarSign,
    Star,
    Megaphone,
    Building2,
    Lock,
} from "lucide-react";

import Image from "next/image";
import SupportNavBadge from "@/components/comercios/SupportNavBadge";
import PedidosNavBadge from "@/components/comercios/PedidosNavBadge";
import MobileMoreMenu from "@/components/comercios/MobileMoreMenu";
import PortalSwitcher from "@/components/ui/PortalSwitcher";
import PWAInstallPrompt from "@/components/onboarding/PWAInstallPrompt";
import SetupProgressBanner from "@/components/comercios/SetupProgressBanner";
import { isFeatureEnabled, FEATURE_FLAGS } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";

export default async function ComerciosLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    // Gate canónico: verifica sesión → no archivado → no suspendido →
    // merchant registrado → no rechazado/suspendido. PENDING entra al panel
    // (modelo panel-inmediato: arma su tienda ya; la visibilidad pública y los
    // pedidos siguen gateados por APPROVED server-side). Si algo falla,
    // requireMerchantAccess() dispara el redirect correcto.
    // Admin bypass está incluido dentro del gate. Ver src/lib/roles.ts.
    // Nota (feat/panel-inmediato-comercio): el estado PENDING se comunica en la
    // tarjeta-guía del dashboard (una sola advertencia por pantalla) — el layout
    // no apila banners propios.
    await requireMerchantAccess(userId);

    // Si llegamos acá, el gate pasó y session es non-null.
    const authedSession = session!;
    const userRoles = getUserRoles(authedSession);

    // Nombre del comercio para el header mobile. La barra de continuidad es
    // CLIENT y se auto-alimenta de /api/merchant/setup (el layout no se
    // re-renderiza al navegar — un cálculo acá quedaría congelado).
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId! },
        orderBy: { createdAt: "asc" },
        select: { name: true },
    });

    // feat/tamanos-producto-desde-ops: si el flag merchant.paquetes está OFF, el
    // item Paquetes se muestra en gris/bloqueado (no navega) en vez de invitar a comprar.
    // feat/bloquear-publicidad: mismo trato para Publicidad (flag merchant.publicidad).
    const [paquetesEnabled, publicidadEnabled] = await Promise.all([
        isFeatureEnabled(FEATURE_FLAGS.MERCHANT_PAQUETES),
        isFeatureEnabled(FEATURE_FLAGS.MERCHANT_PUBLICIDAD),
    ]);
    const flagEnabled: Record<string, boolean> = {
        "merchant.paquetes": paquetesEnabled,
        "merchant.publicidad": publicidadEnabled,
    };

    // Primeros 4 = bottom bar mobile. El resto va en menú "Más"
    // fix/comercio-pausa-stock-y-ajustes (founder 07-27): "el botón más importante
    // para el comercio debe ser el de los pedidos". La barra mobile toma los
    // primeros 4 + "Más", así que Pedidos TERCERO cae en el centro exacto de los 5
    // slots — el punto donde el pulgar llega sin estirarse en un teléfono grande.
    // El consejo advirtió que el orden solo no alcanza: el comerciante mira esta
    // barra mientras cocina o atiende, así que Pedidos además lleva contador rojo
    // (PedidosNavBadge) que solo se apaga cuando acepta o rechaza.
    const navItems: Array<{ href: string; icon: React.ElementType; label: string; requiresFlag?: string }> = [
        { href: "/comercios", icon: LayoutDashboard, label: "Inicio" },
        { href: "/comercios/productos", icon: Package, label: "Productos" },
        { href: "/comercios/pedidos", icon: ShoppingCart, label: "Pedidos" },
        { href: "/comercios/pagos", icon: DollarSign, label: "Pagos" },
        // --- Los siguientes van en sidebar desktop + menú "Más" mobile ---
        { href: "/comercios/mi-comercio", icon: Building2, label: "Mi Comercio" },
        { href: "/comercios/adquirir-paquetes", icon: Store, label: "Paquetes", requiresFlag: "merchant.paquetes" },
        { href: "/comercios/publicidad", icon: Megaphone, label: "Publicidad", requiresFlag: "merchant.publicidad" },
        { href: "/comercios/resenas", icon: Star, label: "Reseñas" },
        // feat/reorg-mi-comercio: "Ajustes" se fusionó dentro de "Mi Comercio".
        // Soporte se renderiza aparte (SupportNavBadge) al final del nav.
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#e60012]">
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
                            // Item bloqueado por flag OFF (Paquetes / Publicidad pre-launch):
                            // se muestra en gris con candado y no navega.
                            const locked = !!item.requiresFlag && !flagEnabled[item.requiresFlag];
                            if (locked) {
                                return (
                                    <li key={item.href}>
                                        <div
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 cursor-not-allowed font-medium"
                                            title="Disponible próximamente"
                                            aria-disabled="true"
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="flex-1">{item.label}</span>
                                            <Lock className="w-4 h-4" />
                                        </div>
                                    </li>
                                );
                            }
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-[#e60012] transition font-medium"
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                        {/* Soporte al final (con su badge de no leídos). */}
                        <li key="soporte-nav"><SupportNavBadge /></li>
                    </ul>
                </nav>

                {/* Portal Switcher */}
                <div className="px-4 py-3 border-t border-gray-100">
                    <PortalSwitcher currentPortal="comercio" userRoles={userRoles} />
                </div>

                <div className="p-4 border-t border-gray-100">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#e60012] font-bold">
                            {authedSession.user?.name?.charAt(0) || "C"}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="font-medium text-sm truncate">{authedSession.user?.name}</p>
                            <p className="text-xs text-gray-400">Comercio</p>
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

            {/* Mobile Header — una sola fila, liviano: logo de marca + nombre del
                comercio; el cambio de portal y el logout viven acá compactos. */}
            <header className="lg:hidden sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 py-2.5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Image src="/logo-moovy.svg" alt="Moovy" width={84} height={24} className="h-[18px] w-auto flex-shrink-0" priority />
                    <span className="h-4 w-px bg-gray-200" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-gray-800">{merchant?.name || "Mi comercio"}</span>
                    <div className="-mx-1 flex-shrink-0">
                        <PortalSwitcher currentPortal="comercio" userRoles={userRoles} compact />
                    </div>
                    <Link href="/logout" className="flex-shrink-0 p-1.5 text-gray-400 transition hover:text-red-600" aria-label="Cerrar sesión">
                        <LogOut className="w-[18px] h-[18px]" />
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 pb-28 lg:p-8 overflow-y-auto">
                <SetupProgressBanner />
                {children}
            </main>

            {/* Mobile Bottom Navigation — barra FLOTANTE redondeada (mismo lenguaje
                que la tienda pública): despegada de los bordes, blur y sombra. */}
            <nav className="lg:hidden fixed left-3 right-3 z-50 w-auto rounded-[24px] border border-gray-200 bg-white shadow-[0_8px_28px_rgba(17,24,39,0.16)]" style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}>
                <div className="flex items-center justify-between h-[62px] px-2 max-w-md mx-auto relative text-center">
                    {navItems.slice(0, 4).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-gray-500 hover:text-[#e60012] active:text-[#c4000f] transition-colors"
                        >
                            <item.icon className="w-6 h-6 mb-0.5" />
                            <span className="text-[10px] font-medium leading-tight">
                                {item.label}
                            </span>
                            {item.href === "/comercios/pedidos" && <PedidosNavBadge />}
                        </Link>
                    ))}
                    <MobileMoreMenu />
                </div>
            </nav>

            {/* PWA install tutorial — iOS sin instalar no recibe push de pedidos nuevos. */}
            <PWAInstallPrompt />
        </div>
    );
}