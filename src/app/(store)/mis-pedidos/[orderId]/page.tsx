"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/delivery";
import {
    ArrowLeft,
    Package,
    MapPin,
    Clock,
    User,
    Phone,
    CheckCircle,
    XCircle,
    Loader2,
    Store,
    Receipt,
    Star,
    RefreshCw,
    Calendar,
    CreditCard,
    Truck
} from "lucide-react";

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
    };
    merchant?: {
        id: string;
        name: string;
        address?: string;
        phone?: string;
    };
    driver?: {
        id: string;
        user: {
            name: string;
            phone?: string;
        };
    };
    driverRating?: number;
    ratingComment?: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    DELIVERED: { label: "Entregado", color: "text-green-600", bgColor: "bg-green-100", icon: <CheckCircle className="w-5 h-5" /> },
    CANCELLED: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-5 h-5" /> },
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        async function loadOrder() {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                if (!res.ok) throw new Error("Pedido no encontrado");
                const data = await res.json();
                setOrder(data);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Error desconocido");
            } finally {
                setLoading(false);
            }
        }

        if (orderId) loadOrder();
    }, [orderId]);

    const handleReorder = async () => {
        if (!order) return;
        setIsReordering(true);

        try {
            // Add items to cart via API or redirect to merchant
            const res = await fetch("/api/cart/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id })
            });

            if (res.ok) {
                router.push("/carrito");
            } else {
                // Fallback: redirect to merchant page
                if (order.merchant?.id) {
                    router.push(`/comercio/${order.merchant.id}`);
                }
            }
        } catch {
            // Fallback: redirect to merchant
            if (order?.merchant?.id) {
                router.push(`/comercio/${order.merchant.id}`);
            }
        } finally {
            setIsReordering(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#e60012] mx-auto mb-4" />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando pedido...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-xl font-bold mb-2">Pedido no encontrado</h1>
                <p className="text-gray-500 mb-8">{error}</p>
                <button
                    onClick={() => router.back()}
                    className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl"
                >
                    Volver
                </button>
            </div>
        );
    }

    const status = statusConfig[order.status] || statusConfig.DELIVERED;
    const orderDate = new Date(order.createdAt);
    const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : orderDate;

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <div className="bg-white sticky top-0 z-30 border-b">
                <div className="flex items-center gap-4 p-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-black italic tracking-tighter text-gray-900 uppercase">
                            Pedido #{order.orderNumber}
                        </h1>
                        <p className="text-xs text-gray-400 font-medium">
                            {orderDate.toLocaleDateString("es-AR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Status Banner */}
                <div className={`${status.bgColor} rounded-2xl p-4 flex items-center gap-4`}>
                    <div className={`w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center ${status.color}`}>
                        {status.icon}
                    </div>
                    <div className="flex-1">
                        <p className={`font-black uppercase tracking-widest text-sm ${status.color}`}>
                            {status.label}
                        </p>
                        <p className="text-xs text-gray-600 font-medium">
                            {deliveredDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                            {" - "}
                            {deliveredDate.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                        </p>
                    </div>
                    {order.driverRating && (
                        <div className="flex items-center gap-1 bg-white/70 px-3 py-1.5 rounded-full">
                            <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                            <span className="font-bold text-sm">{order.driverRating}</span>
                        </div>
                    )}
                </div>

                {/* Merchant Info */}
                {order.merchant && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Store className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comercio</p>
                                <p className="font-bold text-gray-900">{order.merchant.name}</p>
                                {order.merchant.address && (
                                    <p className="text-xs text-gray-500">{order.merchant.address}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                        <Receipt className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Detalle del pedido
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {order.items.map((item) => (
                            <div key={item.id} className="p-4 flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <span className="text-xs font-black text-gray-600">{item.quantity}x</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{item.name}</p>
                                        {item.notes && (
                                            <p className="text-xs text-gray-400 italic">{item.notes}</p>
                                        )}
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="bg-gray-50 p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">{formatPrice(order.subtotal || order.total - (order.deliveryFee || 0))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Envío</span>
                            <span className="font-medium">{formatPrice(order.deliveryFee || 0)}</span>
                        </div>
                        <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                            <span className="font-black uppercase">Total</span>
                            <span className="font-black text-[#e60012]">{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Dirección de entrega
                            </p>
                            <p className="font-bold text-gray-900">
                                {order.address.street} {order.address.number}
                            </p>
                            {order.address.floor && (
                                <p className="text-sm text-gray-500">
                                    Piso {order.address.floor}
                                    {order.address.apartment && `, Depto ${order.address.apartment}`}
                                </p>
                            )}
                            <p className="text-sm text-gray-500">{order.address.city}</p>
                            {order.address.notes && (
                                <p className="text-xs text-gray-400 italic mt-1">{order.address.notes}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Driver Info */}
                {order.driver && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Truck className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Repartidor
                                </p>
                                <p className="font-bold text-gray-900">{order.driver.user.name}</p>
                            </div>
                            {order.driver.user.phone && (
                                <a
                                    href={`tel:${order.driver.user.phone}`}
                                    className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white"
                                >
                                    <Phone className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                        {order.ratingComment && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Tu comentario</p>
                                <p className="text-sm text-gray-600 italic">"{order.ratingComment}"</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Order Info */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                            <p className="text-xs text-gray-400">Fecha del pedido</p>
                            <p className="font-bold text-gray-900">
                                {orderDate.toLocaleDateString("es-AR", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                            <p className="text-xs text-gray-400">Método de pago</p>
                            <p className="font-bold text-gray-900">
                                {order.paymentMethod === "CASH" ? "Efectivo" :
                                    order.paymentMethod === "CARD" ? "Tarjeta" :
                                        order.paymentMethod === "TRANSFER" ? "Transferencia" : order.paymentMethod || "No especificado"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3">
                <button
                    onClick={handleReorder}
                    disabled={isReordering}
                    className="w-full py-4 bg-[#e60012] text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-red-500/20 active:scale-95 transition disabled:opacity-50"
                >
                    {isReordering ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <RefreshCw className="w-5 h-5" />
                    )}
                    Repetir Pedido
                </button>
                <Link
                    href="/mis-pedidos"
                    className="block w-full py-3 text-center text-gray-500 font-bold uppercase tracking-widest text-xs"
                >
                    Ver todos mis pedidos
                </Link>
            </div>
        </div>
    );
}
