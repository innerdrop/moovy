import Link from "next/link";
import {
    Home,
    Store,
    Truck,
    ShoppingBag,
    Shield,
    ArrowUpRight,
} from "lucide-react";

/**
 * Portal definitions — each portal with its route, icon, label, required role, and accent color.
 * "tienda" has no role requirement (always visible).
 */
// NOTA: Todos los hrefs apuntan al destino final (dashboard directo) para
// evitar el "parpadeo" que causaba pasar por páginas raíz con redirect().
// Ver /vendedor/page.tsx y /ops/page.tsx: ambas eran redirects intermedios
// que, durante la navegación client-side de Next.js, mostraban brevemente
// la página de origen antes de llegar al dashboard final. Al apuntar
// directo al dashboard nos ahorramos una navegación y el flash visual.
// /comercios no necesita /dashboard porque NO tiene page.tsx en la raíz
// (el route group (protected) resuelve directo al layout protegido).
const PORTALS = [
    { id: "tienda", href: "/", icon: Home, label: "Tienda", role: null, color: "text-[#e60012]", bg: "bg-red-50" },
    { id: "vendedor", href: "/vendedor/dashboard", icon: ShoppingBag, label: "Vendedor", role: "SELLER", color: "text-purple-600", bg: "bg-purple-50" },
    { id: "comercio", href: "/comercios", icon: Store, label: "Comercio", role: "MERCHANT", color: "text-blue-600", bg: "bg-blue-50" },
    { id: "repartidor", href: "/repartidor/dashboard", icon: Truck, label: "Repartidor", role: "DRIVER", color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: "ops", href: "/ops/dashboard", icon: Shield, label: "OPS", role: "ADMIN", color: "text-slate-600", bg: "bg-slate-100" },
] as const;

type PortalId = typeof PORTALS[number]["id"];

interface PortalSwitcherProps {
    /** The portal the user is currently in (will be excluded from the list) */
    currentPortal: PortalId;
    /** Array of role strings the user has (from getUserRoles) */
    userRoles: string[];
    /** Optional: compact mode for mobile or tight spaces */
    compact?: boolean;
}

/**
 * PortalSwitcher — Server component that renders links to available portals.
 * Shows only portals the user has access to, excluding the current one.
 * Always shows "Tienda" link.
 */
export default function PortalSwitcher({ currentPortal, userRoles, compact = false }: PortalSwitcherProps) {
    const availablePortals = PORTALS.filter((p) => {
        // Exclude the current portal
        if (p.id === currentPortal) return false;
        // Tienda is always available
        if (p.role === null) return true;
        // Show only if user has the required role
        return userRoles.includes(p.role);
    });

    // If only "Tienda" is available, still show it as a simple link
    if (availablePortals.length === 0) return null;

    if (compact) {
        return (
            <div className="flex flex-wrap gap-2">
                {availablePortals.map((p) => (
                    <Link
                        key={p.id}
                        href={p.href}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${p.bg} ${p.color} hover:opacity-80 transition`}
                    >
                        <p.icon className="w-3.5 h-3.5" />
                        {p.label}
                    </Link>
                ))}
            </div>
        );
    }

    return (
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-4 mb-2">
                Mis Portales
            </p>
            <ul className="space-y-0.5">
                {availablePortals.map((p) => (
                    <li key={p.id}>
                        <Link
                            href={p.href}
                            className="flex items-center justify-between px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm font-medium group"
                        >
                            <span className="flex items-center gap-2.5">
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${p.bg}`}>
                                    <p.icon className={`w-4 h-4 ${p.color}`} />
                                </span>
                                {p.label}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition" />
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * PortalSwitcherDark — Dark mode variant for Repartidor portal.
 * Same logic, dark-friendly colors.
 */
export function PortalSwitcherDark({ currentPortal, userRoles }: Omit<PortalSwitcherProps, "compact">) {
    const availablePortals = PORTALS.filter((p) => {
        if (p.id === currentPortal) return false;
        if (p.role === null) return true;
        return userRoles.includes(p.role);
    });

    if (availablePortals.length === 0) return null;

    const darkStyles: Record<string, { bg: string; color: string }> = {
        tienda: { bg: "bg-red-500/10", color: "text-red-400" },
        vendedor: { bg: "bg-purple-500/10", color: "text-purple-400" },
        comercio: { bg: "bg-blue-500/10", color: "text-blue-400" },
        repartidor: { bg: "bg-emerald-500/10", color: "text-emerald-400" },
        ops: { bg: "bg-slate-500/10", color: "text-slate-400" },
    };

    return (
        <>
            {availablePortals.map((p) => {
                const style = darkStyles[p.id] || { bg: "bg-gray-500/10", color: "text-gray-400" };
                return (
                    <Link
                        key={p.id}
                        href={p.href}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-[#22252f] transition"
                    >
                        <div className={`w-10 h-10 ${style.bg} rounded-lg flex items-center justify-center`}>
                            <p.icon className={`w-5 h-5 ${style.color}`} />
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">{p.label}</span>
                        <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto" />
                    </Link>
                );
            })}
        </>
    );
}
