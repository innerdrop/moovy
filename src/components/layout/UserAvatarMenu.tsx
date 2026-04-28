"use client";

// UserAvatarMenu — dropdown del avatar del header con accesos directos a los
// portales del usuario.
//
// feat/avatar-dropdown-portales (2026-04-28): antes el avatar siempre
// linkeaba a /mi-perfil. Un merchant/driver/admin que queria entrar a su panel
// tenia que hacer 2 clicks (avatar -> mi-perfil -> "Panel de X"). Ahora un solo
// click abre el menu con todos sus paneles + Mi Perfil + Cerrar sesion.
//
// Roles se derivan del JWT (`session.roles[]`). Si el JWT esta stale despues
// de una aprobacion recien emitida por OPS, el listener global de
// `roles_updated` (auto-refresh-rol-aprobado, 2026-04-25) ya dispara
// `useSession.update({refreshRoles:true})` y el menu se actualiza solo en la
// proxima apertura. Para usuarios buyer puros sin ningun rol extra, el menu
// muestra solo "Mi Perfil" y "Cerrar sesion".
//
// Para los items que navegan a paneles protegidos (`/comercios`, `/repartidor/*`,
// `/vendedor/*`, `/ops/*`) usamos `window.location.href` directo (hard reload).
// NO llamamos `updateSession({refreshRoles:true})` porque (a) agrega latencia
// asincronica que el usuario percibe como "flash" durante la navegacion, y (b)
// el JWT ya queda actualizado solo por el `RoleUpdateListener` global cuando
// OPS aprueba (rama auto-refresh-rol-aprobado, 2026-04-25). Si por algun
// drift el JWT esta stale, el layout protegido del panel correspondiente
// usa `computeUserAccess` contra DB (source of truth), no el JWT.
// Para Mi Perfil usamos `router.push` (cliente, sin reload).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    User,
    Store,
    Truck,
    ShoppingBag,
    LayoutDashboard,
    LogOut,
    ChevronRight,
} from "lucide-react";

interface UserAvatarMenuProps {
    firstName: string;
    isMarketplace?: boolean;
    /** Tamano del avatar circular. Mobile usa "sm" (28px), desktop "md" (32px). */
    size?: "sm" | "md";
}

interface MenuItem {
    label: string;
    sublabel: string;
    href: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    /** Si true, usa window.location.href (hard nav) para paneles protegidos.
     * Si false, usa router.push (client nav). */
    requiresHardNav: boolean;
}

export default function UserAvatarMenu({
    firstName,
    isMarketplace = false,
    size = "md",
}: UserAvatarMenuProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cerrar al click outside.
    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Cerrar con Escape.
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open]);

    // Derivar roles del JWT. Mismo patron que /mi-perfil/page.tsx.
    const userRoles: string[] = (() => {
        if (!session?.user) return [];
        const u = session.user as { roles?: string[]; role?: string };
        if (Array.isArray(u.roles) && u.roles.length > 0) return u.roles;
        return u.role ? [u.role] : [];
    })();

    const hasSeller = userRoles.includes("SELLER");
    const hasDriver = userRoles.includes("DRIVER");
    const hasMerchant = userRoles.includes("MERCHANT") || userRoles.includes("COMERCIO");
    const hasAdmin = userRoles.includes("ADMIN");

    // Lista dinamica de items segun roles activos.
    const items: MenuItem[] = [
        {
            label: "Mi Perfil",
            sublabel: "Datos, direcciones, puntos",
            href: "/mi-perfil",
            icon: <User className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            requiresHardNav: false,
        },
    ];

    if (hasMerchant) {
        items.push({
            label: "Panel de Comercio",
            sublabel: "Productos, pedidos y configuracion",
            href: "/comercios",
            icon: <Store className="w-4 h-4" />,
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
            requiresHardNav: true,
        });
    }

    if (hasDriver) {
        items.push({
            label: "Panel de Repartidor",
            sublabel: "Pedidos disponibles y entregas",
            href: "/repartidor/dashboard",
            icon: <Truck className="w-4 h-4" />,
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
            requiresHardNav: true,
        });
    }

    if (hasSeller) {
        items.push({
            label: "Panel de Vendedor",
            sublabel: "Listings, ventas y ganancias",
            href: "/vendedor/dashboard",
            icon: <ShoppingBag className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            requiresHardNav: true,
        });
    }

    if (hasAdmin) {
        items.push({
            label: "Panel de Operaciones",
            sublabel: "Administracion y logistica",
            href: "/ops/dashboard",
            icon: <LayoutDashboard className="w-4 h-4" />,
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
            requiresHardNav: false,
        });
    }

    const avatarSizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";
    const brandBg = isMarketplace ? "bg-[#7C3AED]" : "bg-[#e60012]";

    const handleNavigate = (item: MenuItem) => {
        setOpen(false);
        if (item.requiresHardNav) {
            // Hard reload directo. El layout protegido del panel destino usa
            // computeUserAccess contra DB (source of truth) si el JWT estuviera
            // stale por algun drift.
            window.location.href = item.href;
        } else {
            router.push(item.href);
        }
    };

    const handleSignOut = () => {
        setOpen(false);
        signOut({ callbackUrl: "/" });
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Menu de usuario de ${firstName}`}
                className="flex items-center gap-1.5 hover:opacity-80 transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#e60012] rounded-full"
            >
                <div className={`${avatarSizeClass} rounded-full flex items-center justify-center font-bold text-white ${brandBg}`}>
                    {firstName.charAt(0).toUpperCase()}
                </div>
                <span className={`font-semibold text-gray-900 ${size === "sm" ? "text-sm hidden xs:inline" : "text-sm"}`}>
                    {firstName}
                </span>
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Opciones de cuenta"
                    className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                    {items.map((item) => (
                        <button
                            key={item.href}
                            type="button"
                            role="menuitem"
                            onClick={() => handleNavigate(item)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition border-b border-gray-50 group text-left"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center ${item.iconColor} group-hover:scale-110 transition-transform flex-shrink-0`}>
                                    {item.icon}
                                </div>
                                <div className="min-w-0">
                                    <span className="text-sm font-medium text-gray-900 block truncate">
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] text-gray-400 block truncate">
                                        {item.sublabel}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 ml-2" />
                        </button>
                    ))}

                    <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 p-3 hover:bg-red-50 transition text-left group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-red-100 group-hover:text-red-600 transition-colors flex-shrink-0">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">
                            Cerrar sesion
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
