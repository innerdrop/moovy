"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatPrice } from "@/lib/delivery";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { toast } from "@/store/toast";
import {
    Package,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    ShoppingBag,
    ChevronRight,
    Phone,
    Rocket,
    Store,
    CreditCard,
    Banknote,
    Sparkles,
    MapPin
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────
interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    total: number;
    createdAt: string;
    updatedAt: string;
    items: Array<{ id: string; name: string; quantity: number; price: number }>;
    address: {
        street: string;
        number: string;
        city: string;
        latitude?: number;
        longitude?: number;
    };
    merchant?: {
        name: string;
        latitude?: number;
        longitude?: number;
    };
    driver?: {
        id: string;
        latitude?: number;
        longitude?: number;
        user: { name: string; phone?: string };
    };
}

// ─── Status config ────────────────────────────────────────
const statusConfig: Record<string, {
    label: string;
    color: string;
    bg: string;
    dot: string;
    icon: React.ReactNode;
    step: number;
}> = {
    PENDING: { label: "Pendiente", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500", icon: <Clock className="w-4 h-4" />, step: 1 },
    CONFIRMED: { label: "Confirmado", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500", icon: <CheckCircle className="w-4 h-4" />, step: 2 },
    PREPARING: { label: "En preparacion", color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500", icon: <Package className="w-4 h-4" />, step: 3 },
    READY: { label: "Listo para retirar", color: "text-indigo-600", bg: "bg-indigo-50", dot: "bg-indigo-500", icon: <Package className="w-4 h-4" />, step: 4 },
    DRIVER_ASSIGNED: { label: "Repartidor asignado", color: "text-cyan-600", bg: "bg-cyan-50", dot: "bg-cyan-500", icon: <Truck className="w-4 h-4" />, step: 5 },
    PICKED_UP: { label: "Retirado", color: "text-orange-600", bg: "bg-orange-50", dot: "bg-orange-500", icon: <Truck className="w-4 h-4" />, step: 6 },
    IN_DELIVERY: { label: "En camino", color: "text-[#e60012]", bg: "bg-red-50", dot: "bg-[#e60012]", icon: <Truck className="w-4 h-4" />, step: 7 },
    DELIVERED: { label: "Entregado", color: "text-green-600", bg: "bg-green-50", dot: "bg-green-500", icon: <CheckCircle className="w-4 h-4" />, step: 8 },
    CANCELLED: { label: "Cancelado", color: "text-gray-400", bg: "bg-gray-50", dot: "bg-gray-400", icon: <XCircle className="w-4 h-4" />, step: 0 },
};

const TOTAL_STEPS = 7;

// ─── Helpers ──────────────────────────────────────────────
function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const mins = Math.floor((now - then) / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Ayer";
    if (days < 7) return `${days} dias`;
    return new Date(dateStr).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function paymentLabel(m: string) {
    const map: Record<string, string> = { CASH: "Efectivo", cash: "Efectivo", CARD: "Tarjeta", card: "Tarjeta", TRANSFER: "Transferencia", transfer: "Transferencia", mercadopago: "MercadoPago" };
    return map[m] || m || "";
}

// ─── Skeleton ─────────────────────────────────────────────
function CardSkeleton({ i }: { i: number }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="p-4 flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse mb-2" />
                    <div className="h-3 w-48 bg-gray-100 rounded animate-pulse mb-3" />
                    <div className="flex gap-1.5">
                        <div className="h-6 w-20 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-6 w-16 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse flex-shrink-0" />
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────
export default function MisPedidosPage() {
    const { data: session, status: authStatus } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"active" | "history">("active");
    const prevStatuses = useRef<Map<string, string>>(new Map());

    const isAuth = authStatus === "authenticated";
    const userId = session?.user?.id;

    const loadOrders = useCallback(async (silent = false) => {
        try {
            const res = await fetch("/api/orders");
            if (res.ok) setOrders(await res.json());
        } catch (e) {
            console.error("Error loading orders:", e);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // Realtime
    const { isConnected } = useRealtimeOrders({
        role: "customer",
        userId: userId || undefined,
        enabled: isAuth && !!userId,
        onStatusChange: (orderId, status) => {
            const prev = prevStatuses.current.get(orderId);
            if (prev && prev !== status) {
                const cfg = statusConfig[status];
                if (cfg) toast.success(`Tu pedido ahora esta: ${cfg.label}`);
            }
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        },
        onOrderCancelled: (orderId) => {
            toast.error("Tu pedido fue cancelado");
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "CANCELLED" } : o));
        },
        onDriverAssigned: () => {
            toast.success("Se asigno un repartidor a tu pedido");
            loadOrders(true);
        },
    });

    // Track statuses
    useEffect(() => {
        const m = new Map<string, string>();
        orders.forEach(o => m.set(o.id, o.status));
        prevStatuses.current = m;
    }, [orders]);

    useEffect(() => {
        if (!isAuth) { if (authStatus !== "loading") setLoading(false); return; }
        loadOrders();
        const id = setInterval(() => loadOrders(true), 10000);
        return () => clearInterval(id);
    }, [isAuth, authStatus, loadOrders]);

    const activeStatuses = useMemo(() => ["PENDING", "CONFIRMED", "PREPARING", "READY", "DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY"], []);
    const activeOrders = useMemo(() => orders.filter(o => activeStatuses.includes(o.status)), [orders, activeStatuses]);
    const historyOrders = useMemo(() => orders.filter(o => !activeStatuses.includes(o.status)), [orders, activeStatuses]);
    const filtered = tab === "active" ? activeOrders : historyOrders;

    // ─── Loading / Unauthenticated ───
    if (authStatus === "loading" || loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 pt-6 pb-24">
                    <div className="h-8 w-36 bg-gray-200 rounded-lg animate-pulse mb-5" />
                    <div className="flex gap-2 mb-6">
                        <div className="flex-1 h-11 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1 h-11 bg-gray-100 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => <CardSkeleton key={i} i={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuth) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
                <div className="relative mb-8">
                    <div className="w-28 h-28 bg-gray-50 rounded-full flex items-center justify-center">
                        <Package className="w-14 h-14 text-gray-200" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-11 h-11 bg-gradient-to-br from-[#e60012] to-[#ff1a2e] rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                        <Rocket className="w-5 h-5 text-white" />
                    </div>
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Tus pedidos apareceran aqui</h1>
                <p className="text-gray-500 text-sm mb-8 max-w-[280px]">
                    Crea tu cuenta MOOVER y empeza a pedir con beneficios exclusivos.
                </p>
                <Link
                    href="/registro"
                    className="w-full max-w-xs py-3.5 bg-[#e60012] hover:bg-[#cc000f] text-white rounded-xl font-bold text-sm text-center shadow-lg shadow-red-500/20 transition-colors"
                >
                    Crear mi cuenta
                </Link>
                <Link href="/login" className="text-[#e60012] font-semibold text-sm mt-4 hover:underline">
                    Ya tengo cuenta
                </Link>
            </div>
        );
    }

    // ─── Main View ───
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 pt-5 pb-24">

                {/* Title row */}
                <div className="mb-5">
                    <h1 className="text-xl font-black text-gray-900">Mis pedidos</h1>
                </div>

                {/* Tabs — pill style matching the rest of the site */}
                <div className="flex gap-2 mb-5">
                    {([
                        { key: "active" as const, label: "En curso", count: activeOrders.length },
                        { key: "history" as const, label: "Historial", count: historyOrders.length },
                    ]).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${tab === t.key
                                ? "bg-[#e60012] text-white shadow-md shadow-red-500/20"
                                : "bg-white text-gray-500 border border-gray-200 hover:border-[#e60012] hover:text-[#e60012]"
                                }`}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span className={`ml-1.5 text-xs ${tab === t.key ? "text-white/70" : "text-gray-400"}`}>
                                    ({t.count})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Orders */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ShoppingBag className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-semibold text-gray-600 mb-1">
                            {tab === "active" ? "No tenes pedidos en curso" : "Todavia no hay historial"}
                        </p>
                        <p className="text-sm text-gray-400 mb-6 max-w-[260px]">
                            {tab === "active"
                                ? "Cuando hagas un pedido vas a poder seguirlo en tiempo real"
                                : "Tus pedidos completados van a aparecer aca"}
                        </p>
                        <Link
                            href="/productos"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e60012] hover:bg-[#cc000f] text-white rounded-xl text-sm font-bold shadow-md shadow-red-500/15 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Explorar productos
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((order, idx) => {
                            const st = statusConfig[order.status] || statusConfig.PENDING;
                            const isActive = activeStatuses.includes(order.status);
                            const isCancelled = order.status === "CANCELLED";

                            return (
                                <Link
                                    key={order.id}
                                    href={isActive ? `/seguimiento/${order.id}` : `/mis-pedidos/${order.id}`}
                                    className={`group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition border border-gray-100 animate-fade-up ${isCancelled ? "opacity-60" : ""}`}
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                >
                                    {/* ── Card body ── */}
                                    <div className="p-4">
                                        {/* Row 1: Status + Price */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${st.bg} ${st.color}`}>
                                                    {st.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-sm font-bold ${st.color}`}>{st.label}</span>
                                                        {isActive && <span className={`w-1.5 h-1.5 rounded-full ${st.dot} animate-pulse`} />}
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        #{order.orderNumber} &middot; {timeAgo(order.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className={`text-lg font-bold flex-shrink-0 ml-3 ${isCancelled ? "text-gray-300 line-through" : "text-[#e60012]"}`}>
                                                {formatPrice(order.total)}
                                            </p>
                                        </div>

                                        {/* Row 2: Merchant + payment */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                            {order.merchant && (
                                                <span className="flex items-center gap-1 font-medium truncate">
                                                    <Store className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    {order.merchant.name}
                                                </span>
                                            )}
                                            {order.paymentMethod && (
                                                <span className="flex items-center gap-1 flex-shrink-0">
                                                    {(order.paymentMethod === "CASH" || order.paymentMethod === "cash")
                                                        ? <Banknote className="w-3 h-3 text-green-500" />
                                                        : <CreditCard className="w-3 h-3 text-blue-500" />
                                                    }
                                                    {paymentLabel(order.paymentMethod)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Row 3: Items chips */}
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {order.items.slice(0, 3).map(item => (
                                                <span key={item.id} className="text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md font-medium">
                                                    {item.quantity}x {item.name}
                                                </span>
                                            ))}
                                            {order.items.length > 3 && (
                                                <span className="text-xs text-gray-400 px-1 py-0.5">+{order.items.length - 3} mas</span>
                                            )}
                                        </div>

                                        {/* Progress bar — active only */}
                                        {isActive && (
                                            <div className="flex gap-0.5 h-1 mb-3">
                                                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                                                    <div key={i} className={`flex-1 rounded-full transition-all duration-700 ${i < st.step ? "bg-[#e60012]" : "bg-gray-100"}`} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Card footer ── */}
                                    <div className="px-4 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
                                        {isActive && order.driver ? (
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                    <Truck className="w-3 h-3 text-green-600" />
                                                </div>
                                                <span className="text-xs text-gray-600 font-medium truncate">{order.driver.user.name}</span>
                                                {order.driver.user.phone && (
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `tel:${order.driver!.user.phone}`; }}
                                                        className="w-7 h-7 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white ml-auto flex-shrink-0 transition-colors active:scale-90"
                                                    >
                                                        <Phone className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-500 font-semibold">
                                                {isActive ? "Seguir pedido" : "Ver detalle"}
                                            </span>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#e60012] transition-colors flex-shrink-0" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
