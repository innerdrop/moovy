"use client";

// Merchant Orders Page - Panel de Pedidos del Comercio
// Uses dedicated endpoints: confirm, reject, ready (not generic PATCH)
import { useState, useEffect, useCallback, useRef } from "react";
import { formatPrice } from "@/lib/delivery";
import { formatTime } from "@/lib/timezone";
import { formatPinForDisplay } from "@/lib/pin";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { toast } from "@/store/toast";
import {
    ShoppingBag,
    Clock,
    CheckCircle,
    Package,
    Truck,
    XCircle,
    Loader2,
    RefreshCw,
    Bell,
    AlertTriangle,
    Wifi,
    WifiOff,
    SlidersHorizontal,
    KeyRound,
    X,
    Calendar
} from "lucide-react";
import OrderChatPanel from "@/components/orders/OrderChatPanel";

interface SubOrder {
    id: string;
    merchantId: string | null;
    deliveryStatus: string | null;
    pickupPin: string | null;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod?: string;
    total: number;
    createdAt: string;
    items: Array<{ id: string; name: string; quantity: number; price: number }>;
    address: { street: string; number: string; city: string } | null;
    user: { name: string | null; phone: string | null } | null;
    driver?: { user: { name: string | null; phone: string | null } | null } | null;
    pickupPin: string | null;
    deliveryStatus: string | null;
    subOrders?: SubOrder[];
    cancelReason?: string | null;
    // fix/merchant-flow-pedidos: campos que el backend ya tiene pero la UI no consumía.
    isPickup?: boolean;
    deliveryType?: string;
    scheduledSlotStart?: string | null;
    scheduledSlotEnd?: string | null;
}

/**
 * Tarjeta prominente con el PIN de retiro.
 * Se muestra sólo cuando el driver llegó al comercio (DRIVER_ARRIVED).
 * El comerciante debe leer este código al driver antes de entregar el pedido.
 */
function PickupPinBadge({ pin, driverName }: { pin: string; driverName?: string | null }) {
    return (
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 mb-3 shadow-lg ring-2 ring-red-300">
            <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
                    <KeyRound className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-100 uppercase tracking-wide mb-1">
                        PIN de retiro
                    </p>
                    <p className="text-3xl font-mono font-black text-white tracking-widest">
                        {formatPinForDisplay(pin)}
                    </p>
                    <p className="text-xs text-red-50 mt-2 leading-relaxed">
                        Dale este código al repartidor{driverName ? ` (${driverName})` : ""} antes de entregar el pedido.
                        Sin este código no podrá marcarlo como retirado.
                    </p>
                </div>
            </div>
        </div>
    );
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    PENDING: { label: "Nuevo", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: <Bell className="w-5 h-5" /> },
    AWAITING_PAYMENT: { label: "Esperando pago", color: "text-amber-600", bgColor: "bg-amber-100", icon: <Clock className="w-5 h-5" /> },
    SCHEDULED: { label: "Programado", color: "text-violet-600", bgColor: "bg-violet-100", icon: <Calendar className="w-5 h-5" /> },
    SCHEDULED_CONFIRMED: { label: "Programado · confirmado", color: "text-violet-700", bgColor: "bg-violet-100", icon: <Calendar className="w-5 h-5" /> },
    CONFIRMED: { label: "Confirmado", color: "text-blue-600", bgColor: "bg-blue-100", icon: <CheckCircle className="w-5 h-5" /> },
    PREPARING: { label: "Preparando", color: "text-red-600", bgColor: "bg-red-100", icon: <Package className="w-5 h-5" /> },
    READY: { label: "Listo", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: <Package className="w-5 h-5" /> },
    DRIVER_ASSIGNED: { label: "Rider asignado", color: "text-cyan-600", bgColor: "bg-cyan-100", icon: <Truck className="w-5 h-5" /> },
    PICKED_UP: { label: "Recogido", color: "text-orange-600", bgColor: "bg-orange-100", icon: <Truck className="w-5 h-5" /> },
    IN_DELIVERY: { label: "En camino", color: "text-orange-600", bgColor: "bg-orange-100", icon: <Truck className="w-5 h-5" /> },
    DELIVERED: { label: "Entregado", color: "text-green-600", bgColor: "bg-green-100", icon: <CheckCircle className="w-5 h-5" /> },
    CANCELLED: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-5 h-5" /> },
    // Status de fallo que antes caían en el default "Nuevo" amarillo — ahora tienen
    // etiqueta y color propios para que el comercio los identifique en el tab "Fallidos".
    UNASSIGNABLE: { label: "Sin repartidor", color: "text-red-700", bgColor: "bg-red-100", icon: <AlertTriangle className="w-5 h-5" /> },
    REJECTED: { label: "Rechazado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-5 h-5" /> },
};

const CANCELLATION_REASONS = [
    "Producto no disponible",
    "Falta de stock",
    "Comercio cerrado temporalmente",
    "Pedido duplicado",
    "Problema con el pago",
    "Dirección de entrega incorrecta",
    "Cliente no responde",
    "Tiempo de espera excedido",
    "Error en el pedido",
    "Solicitud del cliente",
];

/** Countdown timer showing remaining time before auto-cancel */
function PendingCountdown({ createdAt, timeoutSeconds = 300, onExpire }: { createdAt: string; timeoutSeconds?: number; onExpire?: () => void }) {
    const [remaining, setRemaining] = useState("");
    const [urgent, setUrgent] = useState(false);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const created = new Date(createdAt).getTime();
        const deadline = created + timeoutSeconds * 1000;

        function tick() {
            const diff = deadline - Date.now();
            if (diff <= 0) {
                setRemaining("Expirado");
                setUrgent(true);
                if (!expired) {
                    setExpired(true);
                    onExpire?.();
                }
                return;
            }
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
            setUrgent(diff < 60000); // last minute
        }

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [createdAt, timeoutSeconds]);

    return (
        <div className={`flex items-center gap-1.5 text-xs font-medium mb-3 ${expired ? "text-gray-400" : urgent ? "text-red-600" : "text-yellow-600"}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{expired ? "Tiempo expirado — pedido será cancelado automáticamente" : `Tiempo para confirmar: ${remaining}`}</span>
        </div>
    );
}

/** Sticky banner when socket connection is lost */
function DisconnectionBanner({ since, onRetry }: { since: Date; onRetry: () => void }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        function tick() {
            setElapsed(Math.floor((Date.now() - since.getTime()) / 1000));
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [since]);

    // Only show after 5 seconds of disconnection (avoid flash on brief reconnects)
    if (elapsed < 5) return null;

    const isLong = elapsed > 30;

    return (
        <div className={`rounded-xl p-4 flex items-center justify-between gap-3 ${isLong ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex items-center gap-3 min-w-0">
                <WifiOff className={`w-5 h-5 flex-shrink-0 ${isLong ? "text-red-500" : "text-amber-500"}`} />
                <div className="min-w-0">
                    <p className={`text-sm font-medium ${isLong ? "text-red-800" : "text-amber-800"}`}>
                        {isLong
                            ? "Conexión perdida — podés perderte pedidos nuevos"
                            : "Reconectando al servidor..."}
                    </p>
                    <p className={`text-xs mt-0.5 ${isLong ? "text-red-600" : "text-amber-600"}`}>
                        {isLong
                            ? `Sin conexión hace ${elapsed > 60 ? `${Math.floor(elapsed / 60)} min` : `${elapsed}s`}. Estamos actualizando por REST cada 10s como respaldo.`
                            : "Reintentando automáticamente..."}
                    </p>
                </div>
            </div>
            <button
                onClick={onRetry}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition ${isLong
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
            >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar
            </button>
        </div>
    );
}

export default function ComercioPedidosPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [expiredOrders, setExpiredOrders] = useState<Set<string>>(new Set());
    // "failed" agrupa UNASSIGNABLE / CANCELLED / REJECTED (pedidos que NO llegaron
    // al buyer). Antes todos caían en "completed" junto con los DELIVERED, y el
    // merchant no tenía visibilidad de que un pedido había fracasado post-aceptación.
    const [filter, setFilter] = useState<"active" | "completed" | "failed" | "all">("active");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [merchantId, setMerchantId] = useState<string | null>(null);
    const [unassignableAlerts, setUnassignableAlerts] = useState<{ orderId: string; orderNumber: string }[]>([]);
    const [confirmTimeout, setConfirmTimeout] = useState(300);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cancellation modal state
    const [cancelModal, setCancelModal] = useState<{ open: boolean; orderId: string | null; orderNumber: string }>({
        open: false,
        orderId: null,
        orderNumber: "",
    });
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    // Fetch merchant ID for socket room + confirm timeout from config
    useEffect(() => {
        fetch("/api/merchant/me")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.id) setMerchantId(data.id);
            })
            .catch(() => { });
        fetch("/api/config/public?key=merchant_confirm_timeout_seconds")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.value) setConfirmTimeout(parseInt(data.value, 10) || 300);
            })
            .catch(() => { });
    }, []);

    const loadOrders = useCallback(async (silent = false) => {
        try {
            // Fetch orders for the current merchant
            const res = await fetch("/api/merchant/orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // Real-time order updates via WebSocket
    const { isConnected, disconnectedSince, reconnect } = useRealtimeOrders({
        role: "merchant",
        merchantId: merchantId || undefined,
        enabled: !!merchantId,
        onNewOrder: (order) => {
            // Play notification sound + vibrate
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
            }
            // Vibrate pattern: 3 short pulses (mobile devices)
            if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
            // Show browser notification if page is in background
            if (typeof document !== "undefined" && document.hidden && "Notification" in window && Notification.permission === "granted") {
                new Notification("¡Nuevo pedido en MOOVY!", {
                    body: `Pedido #${order?.orderNumber || "nuevo"} recibido`,
                    icon: "/logo-moovy.svg",
                    tag: "new-order",
                });
            }
            // Reload orders to get full data
            loadOrders(true);
        },
        onStatusChange: (orderId, status) => {
            // Update order in list or reload
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status } : o
            ));
            // ISSUE-001: cuando el driver llega, el backend recién ahora expone el pickupPin.
            // Hacemos un fetch fresco para traerlo (el socket solo manda status, no el PIN).
            if (status === "DRIVER_ARRIVED") {
                loadOrders(true);
            }
        },
        onOrderCancelled: (orderId) => {
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: "CANCELLED" } : o
            ));
        },
        onOrderUnassignable: (orderId, orderNumber) => {
            setUnassignableAlerts(prev => {
                if (prev.some(a => a.orderId === orderId)) return prev;
                return [...prev, { orderId, orderNumber }];
            });
            toast.warning(`No se encontró repartidor para el pedido ${orderNumber}. MOOVY fue notificado.`, 10000);
        },
    });

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Adaptive polling: 10s when socket disconnected, 60s when connected
    useEffect(() => {
        const pollingInterval = isConnected ? 60000 : 10000;
        const intervalId = setInterval(() => loadOrders(true), pollingInterval);
        return () => clearInterval(intervalId);
    }, [isConnected, loadOrders]);

    // ─── Dedicated endpoint handlers ────────────────────────────────────────

    const confirmOrder = async (orderId: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/merchant/orders/${orderId}/confirm`, { method: "POST" });
            if (res.ok) {
                loadOrders(true);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al confirmar el pedido");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    const rejectOrder = async (orderId: string, reason: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/merchant/orders/${orderId}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });
            if (res.ok) {
                loadOrders(true);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al rechazar el pedido");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    const markReady = async (orderId: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/merchant/orders/${orderId}/ready`, { method: "POST" });
            if (res.ok) {
                loadOrders(true);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al marcar como listo");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    // fix/merchant-flow-pedidos (2026-04-26): pickup self-contained.
    // Cuando isPickup=true y status=READY, el comercio cierra la operación marcando
    // el pedido como entregado al cliente (READY → DELIVERED, sin driver).
    const markPickedUpByCustomer = async (orderId: string) => {
        if (!confirm("¿Confirmás que el cliente vino y retiró este pedido?")) return;
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/merchant/orders/${orderId}/mark-picked-up`, { method: "POST" });
            if (res.ok) {
                toast.success("Pedido entregado al cliente");
                loadOrders(true);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al cerrar el pedido");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    // fix/merchant-flow-pedidos: confirmación de pedidos programados.
    // SCHEDULED → SCHEDULED_CONFIRMED. El cron scheduled-notify pasa después a PENDING
    // 45min antes del slot para arrancar el flow normal.
    const confirmScheduled = async (orderId: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/merchant/orders/${orderId}/confirm-scheduled`, { method: "POST" });
            if (res.ok) {
                toast.success("Reserva confirmada — te avisaremos antes del horario");
                loadOrders(true);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al confirmar la reserva");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    const openCancelModal = (orderId: string, orderNumber: string) => {
        setCancelModal({ open: true, orderId, orderNumber });
        setSelectedReason("");
        setCustomReason("");
    };

    const closeCancelModal = () => {
        setCancelModal({ open: false, orderId: null, orderNumber: "" });
        setSelectedReason("");
        setCustomReason("");
    };

    const confirmCancellation = async () => {
        if (!cancelModal.orderId) return;

        const reason = selectedReason === "Otro motivo" ? customReason : selectedReason;
        if (!reason.trim()) {
            toast.warning("Debes seleccionar o escribir un motivo de cancelación");
            return;
        }

        setIsCancelling(true);
        await rejectOrder(cancelModal.orderId, reason);
        setIsCancelling(false);
        closeCancelModal();
    };

    // Tres grupos MUTUAMENTE EXCLUYENTES de status — cada pedido cae en uno solo:
    //   - ACTIVE: en curso desde la perspectiva del merchant (todavía hay que hacer algo).
    //   - COMPLETED: entregado con éxito (DELIVERED).
    //   - FAILED: no llegó al buyer (sin repartidor, cancelado por merchant/buyer/admin, rechazado).
    // Si agregamos un status nuevo a Order.status, hay que sumarlo a uno de estos 3
    // arrays, o el tab "Todos" va a mostrar un pedido fantasma.
    const activeStatuses = ["PENDING", "AWAITING_PAYMENT", "SCHEDULED", "SCHEDULED_CONFIRMED", "CONFIRMED", "PREPARING", "READY", "DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY"];
    const completedStatuses = ["DELIVERED"];
    const failedStatuses = ["UNASSIGNABLE", "CANCELLED", "REJECTED"];

    const filteredOrders = orders.filter(order => {
        if (filter === "active" && !activeStatuses.includes(order.status)) return false;
        if (filter === "completed" && !completedStatuses.includes(order.status)) return false;
        if (filter === "failed" && !failedStatuses.includes(order.status)) return false;
        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            if (new Date(order.createdAt) < from) return false;
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            if (new Date(order.createdAt) > to) return false;
        }
        if (minAmount && order.total < parseFloat(minAmount)) return false;
        if (maxAmount && order.total > parseFloat(maxAmount)) return false;
        return true;
    });

    // Count pending orders for badge
    const pendingCount = orders.filter(o => o.status === "PENDING").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
                    <p className="text-gray-500">Gestiona los pedidos de tu comercio</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Connection indicator */}
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {isConnected ? "En vivo" : "Reconectando..."}
                    </span>
                    <button
                        onClick={() => loadOrders()}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-600"
                        title="Actualizar"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Disconnection Banner — sticky warning when socket is down */}
            {!isConnected && disconnectedSince && (
                <DisconnectionBanner
                    since={disconnectedSince}
                    onRetry={() => {
                        reconnect();
                        loadOrders(true);
                    }}
                />
            )}

            {/* Pending Orders Alert */}
            {pendingCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                    <Bell className="w-6 h-6 text-yellow-600" />
                    <p className="text-yellow-800 font-medium">
                        ¡Tenés <span className="font-bold">{pendingCount}</span> pedido{pendingCount > 1 ? "s" : ""} nuevo{pendingCount > 1 ? "s" : ""}!
                    </p>
                </div>
            )}

            {/* Unassignable Orders Alert */}
            {unassignableAlerts.length > 0 && (
                <div className="space-y-2">
                    {unassignableAlerts.map((alert) => (
                        <div key={alert.orderId} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                                <p className="text-orange-800 text-sm font-medium">
                                    No se encontró repartidor para <span className="font-bold">{alert.orderNumber}</span>. El equipo de MOOVY fue notificado.
                                </p>
                            </div>
                            <button
                                onClick={() => setUnassignableAlerts(prev => prev.filter(a => a.orderId !== alert.orderId))}
                                className="text-orange-400 hover:text-orange-600 ml-2 flex-shrink-0"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Filter Tabs */}
            {(() => {
                const failedCount = orders.filter(o => failedStatuses.includes(o.status)).length;
                return (
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                {[
                    { key: "active", label: "Activos", count: orders.filter(o => activeStatuses.includes(o.status)).length, tone: "default" as const },
                    { key: "completed", label: "Completados", count: orders.filter(o => completedStatuses.includes(o.status)).length, tone: "default" as const },
                    { key: "failed", label: "Fallidos", count: failedCount, tone: "danger" as const },
                    { key: "all", label: "Todos", count: orders.length, tone: "default" as const },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as typeof filter)}
                        className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-medium transition ${filter === tab.key
                            ? tab.tone === "danger"
                                ? "bg-white shadow-sm text-red-600"
                                : "bg-white shadow-sm text-blue-600"
                            : tab.tone === "danger" && tab.count > 0
                                ? "text-red-600 hover:text-red-700"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>
                );
            })()}

            {/* Advanced Filters */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${showFilters ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtros
                </button>
                {(dateFrom || dateTo || minAmount || maxAmount) && (
                    <button
                        onClick={() => { setDateFrom(""); setDateTo(""); setMinAmount(""); setMaxAmount(""); }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition"
                    >
                        <X className="w-3 h-3" /> Limpiar
                    </button>
                )}
            </div>
            {showFilters && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Desde</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Monto mínimo</label>
                        <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="$0" min="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Monto máximo</label>
                        <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="$∞" min="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                </div>
            )}

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-600 mb-2">
                        {filter === "active" ? "No hay pedidos activos" : "No hay pedidos"}
                    </h2>
                    <p className="text-gray-400 text-sm">Los nuevos pedidos aparecerán aquí automáticamente</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig.PENDING;
                        const isUpdating = updating === order.id;
                        const isPending = order.status === "PENDING";

                        return (
                            <div
                                key={order.id}
                                className={`bg-white rounded-xl border overflow-hidden ${isPending ? "ring-2 ring-yellow-400 shadow-md" : "border-gray-100"
                                    }`}
                            >
                                {/* Order Header */}
                                <div className={`px-4 py-3 ${status.bgColor} flex items-center justify-between`}>
                                    <div className="flex items-center gap-2">
                                        <span className={status.color}>{status.icon}</span>
                                        <span className={`font-semibold text-sm ${status.color}`}>{status.label}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {order.orderNumber}
                                    </span>
                                </div>

                                {/* Order Body */}
                                <div className="p-4">
                                    {/* Banner de fallo: cuando un pedido fue cancelado / rechazado / o no tuvo
                                        repartidor, mostramos un bloque rojo con el motivo para que el comercio
                                        entienda QUÉ pasó sin salir de esta tarjeta. */}
                                    {failedStatuses.includes(order.status) && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-semibold text-red-800">
                                                    {order.status === "UNASSIGNABLE" && "No conseguimos repartidor para este pedido"}
                                                    {order.status === "CANCELLED" && "Pedido cancelado"}
                                                    {order.status === "REJECTED" && "Pedido rechazado"}
                                                </p>
                                                {order.cancelReason && (
                                                    <p className="text-red-700 mt-0.5">{order.cancelReason}</p>
                                                )}
                                                {order.status === "UNASSIGNABLE" && (
                                                    <p className="text-red-700 mt-0.5">
                                                        El equipo de soporte ya está al tanto. Si pagaste con MP, el reembolso se procesa automáticamente.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ISSUE-001: PIN de retiro — visible SOLO cuando el driver llegó.
                                        Single-vendor usa order.pickupPin; multi-vendor usa subOrders[].pickupPin
                                        (el backend ya sanitiza: nunca llega el PIN antes de DRIVER_ARRIVED). */}
                                    {order.pickupPin && order.deliveryStatus === "DRIVER_ARRIVED" && (
                                        <PickupPinBadge
                                            pin={order.pickupPin}
                                            driverName={order.driver?.user?.name ?? null}
                                        />
                                    )}
                                    {order.subOrders?.map((sub) =>
                                        sub.pickupPin && sub.deliveryStatus === "DRIVER_ARRIVED" ? (
                                            <PickupPinBadge
                                                key={sub.id}
                                                pin={sub.pickupPin}
                                                driverName={order.driver?.user?.name ?? null}
                                            />
                                        ) : null
                                    )}

                                    {/* Customer & Time */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">{order.user?.name || "Cliente"}</p>
                                            {order.user?.phone && (
                                                <a href={`tel:${order.user.phone}`} className="text-sm text-blue-600 hover:underline">
                                                    {order.user.phone}
                                                </a>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-600">{formatPrice(order.total)}</p>
                                            <p className="text-xs text-gray-400">
                                                {formatTime(order.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items Summary */}
                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Productos:</p>
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            {order.items.map((item) => (
                                                <li key={item.id} className="flex justify-between">
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span className="text-gray-500">{formatPrice(item.price * item.quantity)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Address */}
                                    {order.address && (
                                        <p className="text-xs text-gray-400 mb-4">
                                            📍 {order.address.street} {order.address.number}, {order.address.city}
                                        </p>
                                    )}

                                    {/* Timeout countdown for PENDING */}
                                    {isPending && (
                                        <PendingCountdown
                                            createdAt={order.createdAt}
                                            timeoutSeconds={confirmTimeout}
                                            onExpire={() => setExpiredOrders(prev => new Set(prev).add(order.id))}
                                        />
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 flex-wrap">
                                        {/* Aceptar — disponible para PENDING (cash) y CONFIRMED (MP-paid).
                                            Para PENDING se valida timeout; para CONFIRMED el pago ya está hecho. */}
                                        {(order.status === "PENDING" || order.status === "CONFIRMED") && !expiredOrders.has(order.id) && (
                                            <button
                                                onClick={() => confirmOrder(order.id)}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                {order.status === "CONFIRMED" ? "Aceptar y empezar a preparar" : "Aceptar"}
                                            </button>
                                        )}

                                        {/* Confirmar reserva — para pedidos programados aún no confirmados */}
                                        {order.status === "SCHEDULED" && (
                                            <button
                                                onClick={() => confirmScheduled(order.id)}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                                                Confirmar reserva
                                            </button>
                                        )}

                                        {(order.status === "PREPARING" || order.status === "DRIVER_ASSIGNED") && (
                                            <button
                                                onClick={() => markReady(order.id)}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                {order.isPickup ? "Listo para que el cliente retire" : "Listo para Retirar"}
                                            </button>
                                        )}

                                        {/* Pickup self-contained: cuando el cliente vino y retiró, cerrar la operación */}
                                        {order.status === "READY" && order.isPickup && (
                                            <button
                                                onClick={() => markPickedUpByCustomer(order.id)}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Marcar entregado al cliente
                                            </button>
                                        )}

                                        {/* Reject — extendido a CONFIRMED (MP-paid) y SCHEDULED/SCHEDULED_CONFIRMED. */}
                                        {["PENDING", "CONFIRMED", "PREPARING", "SCHEDULED", "SCHEDULED_CONFIRMED"].includes(order.status) && (
                                            <button
                                                onClick={() => openCancelModal(order.id, order.orderNumber)}
                                                disabled={isUpdating}
                                                className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                                                title="Rechazar Pedido"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Chat con comprador */}
                                    {!["DELIVERED", "CANCELLED"].includes(order.status) && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                                            <OrderChatPanel
                                                orderId={order.id}
                                                orderNumber={order.orderNumber}
                                                chatType="BUYER_MERCHANT"
                                                counterpartName={order.user?.name || "Comprador"}
                                                userRole="merchant"
                                                compact
                                            />
                                            {/* Chat con repartidor — solo si ya fue asignado */}
                                            {order.driver?.user?.name && (
                                                <OrderChatPanel
                                                    orderId={order.id}
                                                    orderNumber={order.orderNumber}
                                                    chatType="DRIVER_MERCHANT"
                                                    counterpartName={order.driver.user.name}
                                                    userRole="merchant"
                                                    compact
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Hidden audio element for notification sound */}
            <audio ref={audioRef} src="/sounds/new-order.wav" preload="auto" />

            {/* Cancellation Modal */}
            {cancelModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Cancelar Pedido</h3>
                                <p className="text-sm text-gray-500">{cancelModal.orderNumber}</p>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-4">
                            Seleccioná el motivo de la cancelación:
                        </p>

                        <div className="space-y-2 mb-4">
                            {CANCELLATION_REASONS.map((reason) => (
                                <label
                                    key={reason}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedReason === reason
                                        ? "border-red-500 bg-red-50"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        className="text-red-600"
                                    />
                                    <span className="text-sm text-gray-700">{reason}</span>
                                </label>
                            ))}
                            <label
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedReason === "Otro motivo"
                                    ? "border-red-500 bg-red-50"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="cancelReason"
                                    value="Otro motivo"
                                    checked={selectedReason === "Otro motivo"}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="text-red-600"
                                />
                                <span className="text-sm text-gray-700">Otro motivo</span>
                            </label>
                        </div>

                        {selectedReason === "Otro motivo" && (
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Escribí el motivo de la cancelación..."
                                rows={3}
                                className="w-full p-3 border border-gray-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={closeCancelModal}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
                                disabled={isCancelling}
                            >
                                Volver
                            </button>
                            <button
                                onClick={confirmCancellation}
                                disabled={isCancelling || !selectedReason || (selectedReason === "Otro motivo" && !customReason.trim())}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCancelling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                                Confirmar Cancelación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
