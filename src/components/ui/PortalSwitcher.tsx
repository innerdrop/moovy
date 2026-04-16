"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    Home,
    Store,
    Truck,
    ShoppingBag,
    Shield,
    ArrowUpRight,
    AlertTriangle,
    X,
} from "lucide-react";
import { toast } from "@/store/toast";

/**
 * Portal definitions \u2014 each portal with its route, icon, label, required role, and accent color.
 * "tienda" has no role requirement (always visible).
 */
// NOTA: Todos los hrefs apuntan al destino final (dashboard directo) para
// evitar el "parpadeo" que causaba pasar por p\u00e1ginas ra\u00edz con redirect().
// Ver /vendedor/page.tsx y /ops/page.tsx: ambas eran redirects intermedios
// que, durante la navegaci\u00f3n client-side de Next.js, mostraban brevemente
// la p\u00e1gina de origen antes de llegar al dashboard final. Al apuntar
// directo al dashboard nos ahorramos una navegaci\u00f3n y el flash visual.
// /comercios no necesita /dashboard porque NO tiene page.tsx en la ra\u00edz
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
 * Hook de navegaci\u00f3n inteligente para el switcher.
 * FIX 2026-04-15: cuando el usuario est\u00e1 en el portal repartidor y cambia a otro,
 * el driver debe desconectarse autom\u00e1ticamente para que no reciba ofertas mientras
 * usa otro portal (y el assignment engine no le asigne pedidos que no va a ver).
 *
 * Flujo:
 *   - Si hay pedido activo en curso (DRIVER_ASSIGNED / DRIVER_ARRIVED / PICKED_UP):
 *     bloquear cambio de portal con modal y CTA "Volver al pedido". El compromiso
 *     asumido con el buyer es sagrado.
 *   - Si est\u00e1 online (DISPONIBLE/OCUPADO) sin pedido: desconectar via PUT
 *     /api/driver/status { status: "FUERA_DE_SERVICIO" } y mostrar toast informativo.
 *   - Si ya est\u00e1 offline: navegar directo sin fricci\u00f3n.
 *
 * Solo aplica cuando currentPortal === "repartidor" y el destino NO es el mismo portal.
 */
function useSmartPortalNavigation(currentPortal: PortalId) {
    const router = useRouter();
    const [blockedOrder, setBlockedOrder] = useState<{ orderNumber: string; orderId: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const navigate = async (targetPortal: PortalId, href: string) => {
        // Solo interceptamos si salimos del portal repartidor
        if (currentPortal !== "repartidor" || targetPortal === "repartidor") {
            router.push(href);
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Chequear pedido activo \u2014 bloquea el cambio
            const activeRes = await fetch("/api/driver/active-order", { cache: "no-store" });
            if (activeRes.ok) {
                const active = await activeRes.json();
                if (active.hasActive && active.orderId) {
                    setBlockedOrder({ orderNumber: active.orderNumber, orderId: active.orderId });
                    return;
                }
            }

            // 2. Chequear estado online \u2014 desconectar si corresponde
            const statusRes = await fetch("/api/driver/status", { cache: "no-store" });
            if (statusRes.ok) {
                const status = await statusRes.json();
                if (status.isOnline) {
                    const disconnectRes = await fetch("/api/driver/status", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "FUERA_DE_SERVICIO" }),
                    });
                    if (disconnectRes.ok) {
                        toast.info(
                            "Te desconectamos del portal repartidor para que otros conductores puedan recibir pedidos. Volv\u00e9 a conectarte cuando est\u00e9s listo."
                        );
                    }
                }
            }
        } catch (error) {
            console.error("[PortalSwitcher] Error en cambio de portal:", error);
            // No bloqueamos la navegaci\u00f3n por errores de red \u2014 mejor dejar salir
        } finally {
            setIsProcessing(false);
        }

        router.push(href);
    };

    return {
        navigate,
        blockedOrder,
        clearBlockedOrder: () => setBlockedOrder(null),
        isProcessing,
    };
}

/**
 * Modal bloqueante cuando el driver intenta cambiar de portal con pedido activo.
 */
function ActiveOrderBlockModal({
    orderNumber,
    orderId,
    onClose,
}: {
    orderNumber: string;
    orderId: string;
    onClose: () => void;
}) {
    const router = useRouter();
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">Ten\u00e9s una entrega en curso</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Complet\u00e1 el pedido <span className="font-mono font-semibold">#{orderNumber}</span> antes
                            de cambiar de portal. El comprador y el comercio est\u00e1n esperando.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            router.push(`/repartidor/entrega/${orderId}`);
                        }}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                    >
                        Volver al pedido
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * PortalSwitcher \u2014 Client component that renders links to available portals.
 * Shows only portals the user has access to, excluding the current one.
 * Always shows "Tienda" link.
 *
 * FIX 2026-04-15: al salir del portal repartidor, intercepta el click para
 * desconectar al driver o bloquear si tiene pedido activo. Ver useSmartPortalNavigation.
 */
export default function PortalSwitcher({ currentPortal, userRoles, compact = false }: PortalSwitcherProps) {
    const { navigate, blockedOrder, clearBlockedOrder, isProcessing } = useSmartPortalNavigation(currentPortal);

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

    const handleClick = (e: React.MouseEvent, targetPortal: PortalId, href: string) => {
        // Solo interceptar si salimos de repartidor \u2014 ahorra fetches innecesarios
        if (currentPortal === "repartidor") {
            e.preventDefault();
            navigate(targetPortal, href);
        }
        // En los dem\u00e1s casos, dejar que el Link normal navegue
    };

    if (compact) {
        return (
            <>
                <div className="flex flex-wrap gap-2">
                    {availablePortals.map((p) => (
                        <Link
                            key={p.id}
                            href={p.href}
                            onClick={(e) => handleClick(e, p.id, p.href)}
                            aria-disabled={isProcessing}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${p.bg} ${p.color} hover:opacity-80 transition ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
                        >
                            <p.icon className="w-3.5 h-3.5" />
                            {p.label}
                        </Link>
                    ))}
                </div>
                {blockedOrder && (
                    <ActiveOrderBlockModal
                        orderNumber={blockedOrder.orderNumber}
                        orderId={blockedOrder.orderId}
                        onClose={clearBlockedOrder}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-4 mb-2">
                    Mis Portales
                </p>
                <ul className="space-y-0.5">
                    {availablePortals.map((p) => (
                        <li key={p.id}>
                            <Link
                                href={p.href}
                                onClick={(e) => handleClick(e, p.id, p.href)}
                                aria-disabled={isProcessing}
                                className={`flex items-center justify-between px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm font-medium group ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
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
            {blockedOrder && (
                <ActiveOrderBlockModal
                    orderNumber={blockedOrder.orderNumber}
                    orderId={blockedOrder.orderId}
                    onClose={clearBlockedOrder}
                />
            )}
        </>
    );
}

/**
 * PortalSwitcherDark \u2014 Dark mode variant for Repartidor portal.
 * Same logic, dark-friendly colors.
 *
 * FIX 2026-04-15: tambi\u00e9n aplica la l\u00f3gica smart de desconexi\u00f3n (este es
 * justamente el switcher que usa el driver para salir de su portal).
 */
export function PortalSwitcherDark({ currentPortal, userRoles }: Omit<PortalSwitcherProps, "compact">) {
    const { navigate, blockedOrder, clearBlockedOrder, isProcessing } = useSmartPortalNavigation(currentPortal);

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

    const handleClick = (e: React.MouseEvent, targetPortal: PortalId, href: string) => {
        if (currentPortal === "repartidor") {
            e.preventDefault();
            navigate(targetPortal, href);
        }
    };

    return (
        <>
            {availablePortals.map((p) => {
                const style = darkStyles[p.id] || { bg: "bg-gray-500/10", color: "text-gray-400" };
                return (
                    <Link
                        key={p.id}
                        href={p.href}
                        onClick={(e) => handleClick(e, p.id, p.href)}
                        aria-disabled={isProcessing}
                        className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-[#22252f] transition ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
                    >
                        <div className={`w-10 h-10 ${style.bg} rounded-lg flex items-center justify-center`}>
                            <p.icon className={`w-5 h-5 ${style.color}`} />
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">{p.label}</span>
                        <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto" />
                    </Link>
                );
            })}
            {blockedOrder && (
                <ActiveOrderBlockModal
                    orderNumber={blockedOrder.orderNumber}
                    orderId={blockedOrder.orderId}
                    onClose={clearBlockedOrder}
                />
            )}
        </>
    );
}
