"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    ShoppingCart,
    Loader2,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    AlertCircle,
    Calendar,
} from "lucide-react";
import { toast } from "@/store/toast";
import OrderChatPanel from "@/components/orders/OrderChatPanel";

interface SubOrder {
    id: string;
    status: string;
    total: number;
    sellerPayout: number | null;
    createdAt: string;
    items: { id: string; name: string; quantity: number; price: number }[];
    orderId?: string;
    // Driver a nivel SubOrder (multi-vendor: cada SubOrder tiene su driver).
    driver?: { id: string; user: { name: string | null } | null } | null;
    order: {
        id?: string;
        orderNumber: string;
        createdAt: string;
        deliveryType?: string;
        scheduledSlotStart?: string | null;
        scheduledSlotEnd?: string | null;
        scheduledConfirmedAt?: string | null;
        status?: string;
        user: { name: string | null } | null;
        // Fallback para single-vendor: si la SubOrder no tiene driver propio,
        // usamos el driver del Order.
        driver?: { id: string; user: { name: string | null } | null } | null;
    };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pendiente", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: <Clock className="w-4 h-4" /> },
    CONFIRMED: { label: "Confirmado", color: "text-blue-600", bgColor: "bg-blue-100", icon: <Package className="w-4 h-4" /> },
    PREPARING: { label: "Preparando", color: "text-purple-600", bgColor: "bg-purple-100", icon: <Package className="w-4 h-4" /> },
    READY: { label: "Listo", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: <Package className="w-4 h-4" /> },
    IN_DELIVERY: { label: "En camino", color: "text-orange-600", bgColor: "bg-orange-100", icon: <Truck className="w-4 h-4" /> },
    DELIVERED: { label: "Entregado", color: "text-green-600", bgColor: "bg-green-100", icon: <CheckCircle className="w-4 h-4" /> },
    CANCELLED: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-4 h-4" /> },
    SCHEDULED: { label: "Programado", color: "text-violet-600", bgColor: "bg-violet-100", icon: <Calendar className="w-4 h-4" /> },
    SCHEDULED_CONFIRMED: { label: "Confirmado", color: "text-blue-600", bgColor: "bg-blue-100", icon: <CheckCircle className="w-4 h-4" /> },
};

const FILTER_TABS = [
    { key: "", label: "Todos" },
    { key: "PENDING", label: "Pendientes" },
    { key: "SCHEDULED", label: "Programados" },
    { key: "DELIVERED", label: "Entregados" },
    { key: "CANCELLED", label: "Cancelados" },
];

function formatSlotTime(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatSlotDate(isoString: string): string {
    const d = new Date(isoString);
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const slotDay = new Date(d);
    slotDay.setHours(0, 0, 0, 0);

    const diffDays = Math.round((slotDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

function getCountdown(isoString: string): string {
    const diff = new Date(isoString).getTime() - Date.now();
    if (diff <= 0) return "Ahora";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `En ${hours}h ${minutes}m`;
    return `En ${minutes}m`;
}

export default function VendedorPedidosPage() {
    const [orders, setOrders] = useState<SubOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const prevPendingCountRef = useRef<number>(0);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            let url = "/api/seller/orders";
            const params = new URLSearchParams();

            if (filter === "SCHEDULED") {
                params.set("deliveryType", "SCHEDULED");
            } else if (filter) {
                params.set("status", filter);
            }

            const qs = params.toString();
            if (qs) url += `?${qs}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Poll every 15 seconds and play sound on new pending orders
    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetch("/api/seller/orders?status=PENDING");
                if (res.ok) {
                    const data: SubOrder[] = await res.json();
                    const pendingCount = data.length;
                    if (pendingCount > prevPendingCountRef.current && prevPendingCountRef.current >= 0) {
                        audioRef.current?.play().catch(() => {});
                        loadOrders();
                    }
                    prevPendingCountRef.current = pendingCount;
                }
            } catch {}
        };
        // Initialize count without sound
        fetch("/api/seller/orders?status=PENDING")
            .then(r => r.ok ? r.json() : [])
            .then((data: SubOrder[]) => { prevPendingCountRef.current = data.length; })
            .catch(() => {});
        const id = setInterval(poll, 15000);
        return () => clearInterval(id);
    }, [loadOrders]);

    async function handleConfirmOrder(subOrderId: string) {
        setConfirmingId(subOrderId);
        try {
            const res = await fetch(`/api/seller/orders/${subOrderId}/confirm`, {
                method: "POST",
            });
            if (res.ok) {
                // Reload orders to reflect updated status
                loadOrders();
                toast.success("Pedido confirmado");
            } else {
                const data = await res.json();
                toast.error(data.error || "Error al confirmar el pedido");
            }
        } catch (error) {
            console.error("Error confirming order:", error);
            toast.error("Error al confirmar el pedido");
        } finally {
            setConfirmingId(null);
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <audio ref={audioRef} src="/sounds/new-order.wav" preload="auto" />
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-emerald-600" />
                    Mis Ventas
                </h1>
                <p className="text-gray-500">Pedidos de tus listings</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {FILTER_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${filter === tab.key
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium text-lg">No hay ventas registradas</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => {
                        const orderStatus = order.order.status || order.status;
                        const config = statusConfig[orderStatus] || statusConfig[order.status] || {
                            label: order.status,
                            color: "text-gray-600",
                            bgColor: "bg-gray-100",
                            icon: <Package className="w-4 h-4" />,
                        };

                        const isScheduled = order.order.deliveryType === "SCHEDULED";
                        const isImmediate = order.order.deliveryType === "IMMEDIATE";
                        const isUnconfirmedScheduled = isScheduled && !order.order.scheduledConfirmedAt && orderStatus !== "CANCELLED";
                        const isUnconfirmedImmediate = isImmediate && order.status === "PENDING" && orderStatus !== "CANCELLED";

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            #{order.order.orderNumber}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {order.order.user?.name || "Cliente"} •{" "}
                                            {new Date(order.order.createdAt).toLocaleDateString("es-AR")}
                                        </p>
                                    </div>
                                    <span
                                        className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${config.bgColor} ${config.color}`}
                                    >
                                        {config.icon}
                                        {config.label}
                                    </span>
                                </div>

                                {/* Scheduled delivery info */}
                                {isScheduled && order.order.scheduledSlotStart && (
                                    <div className={`mb-3 p-3 rounded-lg border ${
                                        isUnconfirmedScheduled
                                            ? "bg-amber-50 border-amber-200"
                                            : "bg-violet-50 border-violet-200"
                                    }`}>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-violet-500" />
                                            <span className="font-semibold text-gray-800">
                                                {formatSlotDate(order.order.scheduledSlotStart)} {formatSlotTime(order.order.scheduledSlotStart)}
                                                {order.order.scheduledSlotEnd && ` - ${formatSlotTime(order.order.scheduledSlotEnd)}`}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-auto">
                                                {getCountdown(order.order.scheduledSlotStart)}
                                            </span>
                                        </div>

                                        {isUnconfirmedScheduled && (
                                            <button
                                                type="button"
                                                onClick={() => handleConfirmOrder(order.id)}
                                                disabled={confirmingId === order.id}
                                                className="mt-2 w-full py-2 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {confirmingId === order.id ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Confirmando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Confirmar pedido programado
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {order.order.scheduledConfirmedAt && (
                                            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Confirmado el{" "}
                                                {new Date(order.order.scheduledConfirmedAt).toLocaleString("es-AR", {
                                                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                                })}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Immediate delivery confirmation */}
                                {isUnconfirmedImmediate && (
                                    <div className="mb-3 p-3 rounded-lg border bg-amber-50 border-amber-200">
                                        <div className="flex items-center gap-2 text-sm mb-2">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            <span className="font-semibold text-gray-800">
                                                Entrega inmediata
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleConfirmOrder(order.id)}
                                            disabled={confirmingId === order.id}
                                            className="w-full py-2 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {confirmingId === order.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Confirmando...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    Confirmar pedido
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Items */}
                                <div className="space-y-1 mb-3">
                                    {order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-gray-600">
                                                {item.quantity}x {item.name}
                                            </span>
                                            <span className="text-gray-900 font-medium">
                                                ${(item.price * item.quantity).toLocaleString("es-AR")}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <div className="text-sm">
                                        <span className="text-gray-500">Total: </span>
                                        <span className="font-bold text-gray-900">
                                            ${order.total.toLocaleString("es-AR")}
                                        </span>
                                    </div>
                                    {order.sellerPayout !== null && (
                                        <div className="text-sm">
                                            <span className="text-gray-500">Tu ganancia: </span>
                                            <span className="font-bold text-emerald-600">
                                                ${order.sellerPayout.toLocaleString("es-AR")}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Chats del pedido: comprador + repartidor (si fue asignado) */}
                                {!["DELIVERED", "CANCELLED"].includes(order.status) && (order.orderId || order.order?.id) && (() => {
                                    const orderPrismaId = (order.orderId || order.order?.id) as string;
                                    // Driver asignado a ESTA SubOrder (multi-vendor) con fallback
                                    // al driver del Order (single-vendor).
                                    const driver = order.driver || order.order?.driver || null;
                                    const driverName = driver?.user?.name;
                                    return (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                                            <OrderChatPanel
                                                orderId={orderPrismaId}
                                                orderNumber={order.order.orderNumber}
                                                chatType="BUYER_SELLER"
                                                subOrderId={order.id}
                                                counterpartName={order.order.user?.name || "Comprador"}
                                                userRole="seller"
                                                compact
                                            />
                                            {driverName && (
                                                <OrderChatPanel
                                                    orderId={orderPrismaId}
                                                    orderNumber={order.order.orderNumber}
                                                    chatType="DRIVER_SELLER"
                                                    subOrderId={order.id}
                                                    counterpartName={driverName}
                                                    userRole="seller"
                                                    compact
                                                />
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
