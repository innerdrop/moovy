"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/delivery";
import { toast } from "@/store/toast";
import {
    ArrowLeft,
    Package,
    MapPin,
    Clock,
    Phone,
    CheckCircle,
    XCircle,
    Loader2,
    Store,
    Star,
    RefreshCw,
    Calendar,
    CreditCard,
    Truck,
    Banknote,
    Share2,
    HelpCircle,
    AlertTriangle,
    MessageCircle,
    X,
    ChevronRight,
    FileText
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import RateMerchantModal from "@/components/orders/RateMerchantModal";
import RateSellerModal from "@/components/orders/RateSellerModal";
import OrderChatPanel from "@/components/orders/OrderChatPanel";
import { buildDeliveryContext } from "@/lib/delivery-chat";
import dynamic from "next/dynamic";

const OrderTrackingMiniMap = dynamic(() => import("@/components/orders/OrderTrackingMiniMap"), {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />,
});

// ─── Types ────────────────────────────────────────────────
interface OrderDetail {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    total: number;
    subtotal: number;
    deliveryFee: number;
    createdAt: string;
    updatedAt: string;
    deliveredAt?: string;
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        notes?: string;
    }>;
    address: {
        street: string;
        number: string;
        city: string;
        floor?: string;
        apartment?: string;
        notes?: string;
        latitude?: number;
        longitude?: number;
    };
    merchant?: {
        id: string;
        name: string;
        address?: string;
        phone?: string;
        latitude?: number;
        longitude?: number;
    };
    driver?: {
        id: string;
        latitude?: number;
        longitude?: number;
        user: { name: string; phone?: string };
    };
    driverRating?: number;
    ratingComment?: string;
    merchantRating?: number;
    merchantRatingComment?: string;
    sellerRating?: number;
    sellerRatingComment?: string;
    isMultiVendor?: boolean;
    subOrders?: Array<{
        id: string;
        status: string;
        subtotal: number;
        deliveryFee: number;
        total: number;
        deliveryStatus?: string;
        merchantId?: string;
        sellerId?: string;
        driverId?: string;
        merchant?: { id: string; name: string; latitude?: number; longitude?: number; address?: string };
        seller?: { id: string; displayName?: string };
        driver?: { id: string; latitude?: number; longitude?: number; user: { name: string; phone?: string } };
        items?: Array<{ id: string; name: string; quantity: number; price: number }>;
    }>;
}

// ─── Timeline steps ───────────────────────────────────────
const timeline = [
    { key: "PENDING", label: "Pedido recibido", icon: Clock },
    { key: "CONFIRMED", label: "Confirmado por el comercio", icon: CheckCircle },
    { key: "PREPARING", label: "Preparando tu pedido", icon: Package },
    { key: "READY", label: "Listo para retirar", icon: Package },
    { key: "DRIVER_ASSIGNED", label: "Repartidor en camino al local", icon: Truck },
    { key: "PICKED_UP", label: "Pedido retirado", icon: Truck },
    { key: "IN_DELIVERY", label: "En camino a tu domicilio", icon: Truck },
    { key: "DELIVERED", label: "Entregado", icon: CheckCircle },
];

// ─── Helpers ──────────────────────────────────────────────
function paymentLabel(m: string) {
    const map: Record<string, string> = { CASH: "Efectivo", cash: "Efectivo", CARD: "Tarjeta", card: "Tarjeta", TRANSFER: "Transferencia", transfer: "Transferencia", mercadopago: "MercadoPago" };
    return map[m] || m || "No especificado";
}

// ─── Component ────────────────────────────────────────────
export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReordering, setIsReordering] = useState(false);
    const [showMerchantRating, setShowMerchantRating] = useState(false);
    const [showSellerRating, setShowSellerRating] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [driverLocation, setDriverLocation] = useState<any>(null);

    // Fetch order
    useEffect(() => {
        if (!orderId) return;
        (async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                if (!res.ok) throw new Error("Pedido no encontrado");
                setOrder(await res.json());
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Error desconocido");
            } finally {
                setLoading(false);
            }
        })();
    }, [orderId]);

    // Poll active orders
    const isActive = order && !["DELIVERED", "CANCELLED"].includes(order.status);
    useEffect(() => {
        if (!isActive || !orderId) return;
        const id = setInterval(async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                if (res.ok) setOrder(await res.json());
            } catch { /* silent */ }
        }, 10000);
        return () => clearInterval(id);
    }, [isActive, orderId]);

    // Fetch delivery context for active driver deliveries
    useEffect(() => {
        if (!order?.driver || !isActive || !orderId) return;
        
        const fetchContext = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}/delivery-context`);
                if (res.ok) {
                    setDriverLocation(await res.json());
                }
            } catch { /* silent */ }
        };
        
        fetchContext();
        const id = setInterval(fetchContext, 15000); // Update every 15s
        return () => clearInterval(id);
    }, [order?.driver, isActive, orderId]);

    const canCancel = order && ["PENDING", "CONFIRMED"].includes(order.status);
    const isDelivered = order?.status === "DELIVERED";
    const isCancelled = order?.status === "CANCELLED";
    const showMap = isActive && ["READY", "DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY"].includes(order?.status || "");

    const currentStepIdx = useMemo(() => {
        if (!order) return -1;
        return timeline.findIndex(s => s.key === order.status);
    }, [order]);

    // ─── Actions ──────────────────────────────────────────
    const handleReorder = async () => {
        if (!order) return;
        setIsReordering(true);
        try {
            const res = await fetch("/api/cart/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id }),
            });
            const data = await res.json();
            if (res.ok) {
                useCartStore.setState({ items: data.items });
                router.push("/carrito");
            } else {
                toast.error(data.error || "No se pudo repetir el pedido");
                if (res.status !== 400 && order.merchant?.id) router.push(`/comercio/${order.merchant.id}`);
            }
        } catch {
            toast.error("Error al repetir el pedido");
            if (order?.merchant?.id) router.push(`/comercio/${order.merchant.id}`);
        } finally {
            setIsReordering(false);
        }
    };

    const handleCancel = async () => {
        if (!order) return;
        setIsCancelling(true);
        try {
            const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Pedido cancelado");
                setOrder(prev => prev ? { ...prev, status: "CANCELLED" } : null);
                setShowCancelModal(false);
            } else {
                const data = await res.json();
                toast.error(data.error || "No se pudo cancelar");
            }
        } catch {
            toast.error("Error al cancelar");
        } finally {
            setIsCancelling(false);
        }
    };

    const handleShare = () => {
        if (!order) return;
        const step = timeline.find(s => s.key === order.status);
        const text = `Mi pedido #${order.orderNumber} de ${order.merchant?.name || "MOOVY"} — ${step?.label || order.status}`;
        const url = `${window.location.origin}/mis-pedidos/${order.id}`;
        if (navigator.share) {
            navigator.share({ title: `Pedido #${order.orderNumber}`, text, url }).catch(() => { });
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank");
        }
    };

    const handleDownloadReceipt = () => {
        if (!order) return;
        window.open(`/api/orders/${order.id}/receipt`, "_blank");
    };

    // ─── Loading ──────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b px-4 lg:px-6 xl:px-8 py-4 lg:py-6 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
                    <div className="flex-1">
                        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-1.5" />
                        <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
                <div className="container mx-auto px-4 lg:px-6 xl:px-8 pt-5 lg:pt-8 space-y-4 lg:space-y-6">
                    <div className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
                    <div className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse" />
                    <div className="h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />
                </div>
            </div>
        );
    }

    // ─── Error ────────────────────────────────────────────
    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-xl font-black text-gray-900 mb-1">Pedido no encontrado</h1>
                <p className="text-gray-400 text-sm mb-6 text-center max-w-xs">{error}</p>
                <button onClick={() => router.back()} className="px-6 py-2.5 bg-[#e60012] hover:bg-[#cc000f] text-white rounded-xl font-bold text-sm transition-colors">
                    Volver
                </button>
            </div>
        );
    }

    const orderDate = new Date(order.createdAt);
    const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* ── Header ── */}
            <div className="bg-white sticky top-0 z-30 border-b border-gray-100">
                <div className="container mx-auto px-4 lg:px-6 xl:px-8 py-3 lg:py-4 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-700" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-bold text-gray-900 truncate">
                            Pedido #{order.orderNumber}
                        </h1>
                        <p className="text-xs text-gray-400">
                            {orderDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                    </div>
                    <button onClick={handleShare} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition active:scale-95">
                        <Share2 className="w-4 h-4 text-gray-600" />
                    </button>
                    {(isDelivered || order?.paymentStatus === "PAID" || order?.paymentStatus === "paid") && (
                        <button onClick={handleDownloadReceipt} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition active:scale-95" title="Descargar comprobante">
                            <FileText className="w-4 h-4 text-gray-600" />
                        </button>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-6 xl:px-8 pt-5 lg:pt-8 space-y-4 lg:space-y-6">

                {/* ── Status Hero ── */}
                <div className={`rounded-xl p-4 ${isCancelled ? "bg-gray-100" : isDelivered ? "bg-green-50" : "bg-gradient-to-r from-red-50 to-orange-50"}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCancelled ? "bg-white text-gray-400" : isDelivered ? "bg-white text-green-500" : "bg-white/80 text-[#e60012]"} shadow-sm`}>
                            {isCancelled ? <XCircle className="w-6 h-6" /> : isDelivered ? <CheckCircle className="w-6 h-6" /> : currentStepIdx >= 0 ? (() => { const Icon = timeline[currentStepIdx].icon; return <Icon className="w-6 h-6" />; })() : <Package className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <p className={`font-bold text-sm ${isCancelled ? "text-gray-500" : isDelivered ? "text-green-700" : "text-gray-900"}`}>
                                {isCancelled ? "Pedido cancelado" : currentStepIdx >= 0 ? timeline[currentStepIdx].label : order.status}
                            </p>
                            <p className="text-xs text-gray-500">
                                {isDelivered && deliveredDate
                                    ? `${deliveredDate.toLocaleDateString("es-AR", { day: "numeric", month: "long" })} a las ${deliveredDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
                                    : isActive
                                        ? "Actualizando en tiempo real"
                                        : isCancelled
                                            ? "Este pedido fue cancelado"
                                            : ""}
                            </p>
                        </div>
                        {order.driverRating && (
                            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-sm">
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-bold">{order.driverRating}</span>
                            </div>
                        )}
                    </div>

                    {/* Progress bar */}
                    {isActive && currentStepIdx >= 0 && (
                        <div className="flex gap-0.5 h-1 mt-3">
                            {timeline.map((_, i) => (
                                <div key={i} className={`flex-1 rounded-full transition-all duration-700 ${i <= currentStepIdx ? "bg-[#e60012]" : "bg-black/5"}`} />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Timeline ── */}
                {!isCancelled && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs font-semibold text-gray-400 mb-4">PROGRESO</p>
                        <div className="relative">
                            {timeline.map((step, idx) => {
                                const Icon = step.icon;
                                const done = idx <= currentStepIdx;
                                const current = idx === currentStepIdx;
                                const last = idx === timeline.length - 1;

                                return (
                                    <div key={step.key} className="flex gap-3 relative">
                                        {/* Line */}
                                        {!last && (
                                            <div className={`absolute left-[15px] top-[30px] w-0.5 h-[calc(100%-6px)] ${done ? "bg-[#e60012]/20" : "bg-gray-100"}`} />
                                        )}
                                        {/* Dot */}
                                        <div className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all ${current
                                            ? "bg-[#e60012] text-white shadow-md shadow-red-500/20 scale-110"
                                            : done
                                                ? "bg-[#e60012]/10 text-[#e60012]"
                                                : "bg-gray-100 text-gray-300"
                                            }`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        {/* Text */}
                                        <div className={`pb-5 ${!done ? "opacity-30" : ""}`}>
                                            <p className={`text-sm ${current ? "font-bold text-gray-900" : done ? "font-medium text-gray-700" : "font-medium text-gray-400"}`}>
                                                {step.label}
                                            </p>
                                            {current && (
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    {new Date(order.updatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Multi-vendor SubOrder Deliveries ── */}
                {order.isMultiVendor && order.subOrders && order.subOrders.length > 1 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <Truck className="w-4 h-4 text-blue-500" />
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                {order.subOrders.length} entregas independientes
                            </p>
                        </div>

                        {order.subOrders.map((so, idx) => {
                            const soMerchant = so.merchant;
                            const soDriver = so.driver;
                            const soStatusLabel = (() => {
                                const map: Record<string, string> = {
                                    PENDING: "Pendiente",
                                    CONFIRMED: "Confirmado",
                                    PREPARING: "Preparando",
                                    READY: "Listo",
                                    PICKED_UP: "Retirado",
                                    IN_DELIVERY: "En camino",
                                    DELIVERED: "Entregado",
                                    CANCELLED: "Cancelado",
                                };
                                return map[so.status] || so.status;
                            })();
                            const soIsActive = !["DELIVERED", "CANCELLED"].includes(so.status);
                            const showSoMap = soIsActive && ["READY", "PICKED_UP", "IN_DELIVERY"].includes(so.status);

                            return (
                                <div key={so.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* SubOrder header */}
                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${so.status === "DELIVERED" ? "bg-green-50" : soIsActive ? "bg-blue-50" : "bg-gray-50"}`}>
                                            <Store className={`w-4 h-4 ${so.status === "DELIVERED" ? "text-green-500" : soIsActive ? "text-blue-500" : "text-gray-400"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {soMerchant?.name || so.seller?.displayName || `Entrega ${idx + 1}`}
                                            </p>
                                            <p className={`text-xs font-medium ${so.status === "DELIVERED" ? "text-green-600" : soIsActive ? "text-blue-600" : "text-gray-400"}`}>
                                                {soStatusLabel}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">
                                            Envío: {formatPrice(so.deliveryFee)}
                                        </span>
                                    </div>

                                    {/* Items in this SubOrder */}
                                    {so.items && so.items.length > 0 && (
                                        <div className="px-4 py-2 space-y-1">
                                            {so.items.map(item => (
                                                <div key={item.id} className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-600 truncate">{item.quantity}x {item.name}</span>
                                                    <span className="text-gray-500 font-medium flex-shrink-0 ml-2">{formatPrice(item.price * item.quantity)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Mini map for active SubOrder deliveries */}
                                    {showSoMap && soMerchant && (
                                        <div className="border-t border-gray-100">
                                            <OrderTrackingMiniMap
                                                orderId={order.id}
                                                orderStatus={so.status}
                                                merchantLat={soMerchant.latitude}
                                                merchantLng={soMerchant.longitude}
                                                merchantName={soMerchant.name}
                                                customerLat={order.address?.latitude}
                                                customerLng={order.address?.longitude}
                                                customerAddress={`${order.address.street} ${order.address.number}`}
                                                initialDriverLat={soDriver?.latitude}
                                                initialDriverLng={soDriver?.longitude}
                                                height="150px"
                                                showEta
                                            />
                                        </div>
                                    )}

                                    {/* Driver info for this SubOrder */}
                                    {soDriver && (
                                        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-2.5">
                                            <Truck className="w-3.5 h-3.5 text-green-500" />
                                            <span className="text-xs font-medium text-gray-700">{soDriver.user.name}</span>
                                            {soDriver.user.phone && (
                                                <a href={`tel:${soDriver.user.phone}`} className="ml-auto text-xs text-green-600 font-semibold hover:underline">
                                                    Llamar
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Waiting for driver */}
                                    {!soDriver && soIsActive && ["PREPARING", "READY"].includes(so.status) && (
                                        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-2">
                                            <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                                            <span className="text-xs text-gray-400">Buscando repartidor...</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Map (single-vendor only) ── */}
                {showMap && !order.isMultiVendor && (
                    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <OrderTrackingMiniMap
                            orderId={order.id}
                            orderStatus={order.status}
                            merchantLat={order.merchant?.latitude}
                            merchantLng={order.merchant?.longitude}
                            merchantName={order.merchant?.name}
                            customerLat={order.address?.latitude}
                            customerLng={order.address?.longitude}
                            customerAddress={`${order.address.street} ${order.address.number}`}
                            initialDriverLat={order.driver?.latitude}
                            initialDriverLng={order.driver?.longitude}
                            height="200px"
                            showEta
                        />
                    </div>
                )}

                {/* ── Merchant (single-vendor only) ── */}
                {order.merchant && !order.isMultiVendor && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Store className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Comercio</p>
                                <p className="font-bold text-gray-900 text-sm truncate">{order.merchant.name}</p>
                                {order.merchant.address && <p className="text-xs text-gray-400 truncate">{order.merchant.address}</p>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {isDelivered && !order.merchantRating && (
                                    <button
                                        onClick={() => setShowMerchantRating(true)}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition flex items-center gap-1 active:scale-95"
                                    >
                                        <Star className="w-3 h-3" /> Calificar
                                    </button>
                                )}
                                {order.merchantRating && (
                                    <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1.5 rounded-lg">
                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        <span className="text-xs font-bold text-gray-700">{order.merchantRating}</span>
                                    </div>
                                )}
                                {order.merchant.phone && (
                                    <a href={`tel:${order.merchant.phone}`} className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center text-white transition active:scale-95">
                                        <Phone className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Chat con comercio ── */}
                {order.merchant && isActive && (
                    <OrderChatPanel
                        orderId={order.id}
                        orderNumber={order.orderNumber}
                        chatType="BUYER_MERCHANT"
                        counterpartName={order.merchant.name}
                        userRole="buyer"
                        compact
                    />
                )}

                {/* ── Chat con repartidor ── */}
                {order.driver && isActive && (
                    <OrderChatPanel
                        orderId={order.id}
                        orderNumber={order.orderNumber}
                        chatType="BUYER_DRIVER"
                        counterpartName={order.driver.user.name}
                        userRole="buyer"
                        compact
                        driverLocation={driverLocation}
                    />
                )}

                {/* ── Seller (Marketplace) ── */}
                {order.subOrders?.some(so => so.seller) && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Star className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Vendedor</p>
                                <p className="font-bold text-gray-900 text-sm truncate">
                                    {order.subOrders?.find(so => so.seller)?.seller?.displayName || "Vendedor"}
                                </p>
                            </div>
                            {isDelivered && !order.sellerRating && (
                                <button
                                    onClick={() => setShowSellerRating(true)}
                                    className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition flex items-center gap-1 active:scale-95"
                                >
                                    <Star className="w-3 h-3" /> Calificar
                                </button>
                            )}
                            {order.sellerRating && (
                                <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1.5 rounded-lg">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs font-bold text-gray-700">{order.sellerRating}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Chat con vendedor ── */}
                {order.subOrders?.some(so => so.seller) && isActive && (
                    <OrderChatPanel
                        orderId={order.id}
                        orderNumber={order.orderNumber}
                        chatType="BUYER_SELLER"
                        counterpartName={order.subOrders?.find(so => so.seller)?.seller?.displayName || "Vendedor"}
                        userRole="buyer"
                        compact
                    />
                )}

                {/* ── Driver (single-vendor only — multi-vendor shows per SubOrder) ── */}
                {order.driver && !order.isMultiVendor && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Truck className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Repartidor</p>
                                <p className="font-bold text-gray-900 text-sm">{order.driver.user.name}</p>
                            </div>
                            {order.driver.user.phone && (
                                <a href={`tel:${order.driver.user.phone}`} className="w-9 h-9 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center text-white transition active:scale-95">
                                    <Phone className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                        {order.ratingComment && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><MessageCircle className="w-3 h-3" /> Tu comentario</p>
                                <p className="text-sm text-gray-600 italic">&ldquo;{order.ratingComment}&rdquo;</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Items ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-400">DETALLE DEL PEDIDO</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {order.items.map(item => (
                            <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
                                <div className="flex gap-2.5 min-w-0 flex-1">
                                    <span className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                                        {item.quantity}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                                        {item.notes && <p className="text-[11px] text-gray-400 italic truncate">{item.notes}</p>}
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-gray-700 flex-shrink-0">
                                    {formatPrice(item.price * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-gray-50 px-4 py-3 space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-600">{formatPrice(order.subtotal || order.total - (order.deliveryFee || 0))}</span>
                        </div>
                        {/* Multi-vendor: show per-SubOrder delivery fees */}
                        {order.isMultiVendor && order.subOrders && order.subOrders.length > 1 ? (
                            <>
                                {order.subOrders.map((so, idx) => (
                                    <div key={so.id} className="flex justify-between text-sm">
                                        <span className="text-gray-500 truncate">Envío {so.merchant?.name || so.seller?.displayName || `#${idx + 1}`}</span>
                                        <span className="font-medium text-gray-600 flex-shrink-0 ml-2">{formatPrice(so.deliveryFee)}</span>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Envío</span>
                                <span className={`font-medium ${order.deliveryFee ? "text-gray-600" : "text-green-600"}`}>
                                    {order.deliveryFee ? formatPrice(order.deliveryFee) : "Gratis"}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-bold text-lg text-[#e60012]">{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Address ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-[#e60012]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Entrega</p>
                            <p className="font-bold text-gray-900 text-sm">{order.address.street} {order.address.number}</p>
                            {order.address.floor && (
                                <p className="text-xs text-gray-500">Piso {order.address.floor}{order.address.apartment && `, Depto ${order.address.apartment}`}</p>
                            )}
                            <p className="text-xs text-gray-400">{order.address.city}</p>
                            {order.address.notes && (
                                <p className="text-xs text-gray-400 italic mt-1 bg-gray-50 px-2 py-1 rounded-md inline-block">{order.address.notes}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Meta (date + payment) ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {orderDate.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className="text-gray-200">|</span>
                        <span className="flex items-center gap-1.5">
                            {(order.paymentMethod === "CASH" || order.paymentMethod === "cash")
                                ? <Banknote className="w-3.5 h-3.5 text-green-500" />
                                : <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                            }
                            {paymentLabel(order.paymentMethod)}
                        </span>
                    </div>
                </div>

                {/* ── Help ── */}
                <Link
                    href="/ayuda"
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition active:scale-[0.99]"
                >
                    <HelpCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-600 flex-1">Necesitas ayuda con este pedido?</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
            </div>

            {/* ── Bottom Bar ── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-20" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
                <div className="container mx-auto px-4 pt-3">
                    {isActive && !isCancelled && (
                        <div className="flex gap-2">
                            {canCancel && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition active:scale-95"
                                >
                                    Cancelar
                                </button>
                            )}
                            <Link
                                href={`/seguimiento/${order.id}`}
                                className="flex-1 py-3 bg-[#e60012] hover:bg-[#cc000f] text-white rounded-xl text-sm font-bold text-center shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Truck className="w-4 h-4" />
                                Seguir en vivo
                            </Link>
                        </div>
                    )}
                    {isDelivered && (
                        <button
                            onClick={handleReorder}
                            disabled={isReordering}
                            className="w-full py-3 bg-[#e60012] hover:bg-[#cc000f] text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {isReordering ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Repetir pedido
                        </button>
                    )}
                    {isCancelled && (
                        <button
                            onClick={handleReorder}
                            disabled={isReordering}
                            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {isReordering ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Volver a pedir
                        </button>
                    )}
                </div>
            </div>

            {/* ── Cancel Modal ── */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
                    <div className="relative bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 animate-slideUp">
                        <button onClick={() => setShowCancelModal(false)} className="absolute top-3 right-3 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
                                <AlertTriangle className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Cancelar pedido?</h3>
                            <p className="text-sm text-gray-500 mb-5">Esta accion no se puede deshacer.</p>
                            <div className="flex gap-2 w-full">
                                <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition active:scale-95">
                                    No, volver
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isCancelling}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition active:scale-95 disabled:opacity-50"
                                >
                                    {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Si, cancelar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Rating Modals ── */}
            {showMerchantRating && order.merchant && (
                <RateMerchantModal
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    merchantName={order.merchant.name}
                    onClose={() => setShowMerchantRating(false)}
                    onSuccess={() => {
                        fetch(`/api/orders/${orderId}`).then(r => r.json()).then(d => setOrder(d)).catch(() => {});
                    }}
                />
            )}
            {showSellerRating && order.subOrders?.[0]?.seller && (
                <RateSellerModal
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    sellerName={order.subOrders[0].seller.displayName || "Vendedor"}
                    onClose={() => setShowSellerRating(false)}
                    onSuccess={() => {
                        fetch(`/api/orders/${orderId}`).then(r => r.json()).then(d => setOrder(d)).catch(() => {});
                    }}
                />
            )}
        </div>
    );
}
