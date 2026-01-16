"use client";

// Driver Deliveries Page - Entregas del Conductor
import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/delivery";
import {
    Package,
    MapPin,
    CheckCircle,
    Truck,
    Navigation,
    Phone,
    RefreshCw,
    Loader2,
    Camera,
    XCircle,
    Clock
} from "lucide-react";

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    deliveryStatus: string | null;
    total: number;
    createdAt: string;
    items: Array<{ id: string; name: string; quantity: number }>;
    address: { street: string; number: string; apartment: string | null; city: string; latitude: number | null; longitude: number | null } | null;
    user: { name: string | null; phone: string | null } | null;
    merchant: { name: string; address: string | null } | null;
}

export default function ConductorEntregasPage() {
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"available" | "my">("available");

    const loadOrders = useCallback(async (silent = false) => {
        try {
            const res = await fetch("/api/driver/orders");
            if (res.ok) {
                const data = await res.json();
                setAvailableOrders(data.available || []);
                setMyDeliveries(data.myDeliveries || []);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
        // Poll every 10 seconds
        const intervalId = setInterval(() => loadOrders(true), 10000);
        return () => clearInterval(intervalId);
    }, [loadOrders]);

    const claimOrder = async (orderId: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/driver/orders/${orderId}/claim`, {
                method: "POST",
            });
            if (res.ok) {
                loadOrders(true);
                setActiveTab("my"); // Switch to my deliveries
            } else {
                const data = await res.json();
                alert(data.error || "Error al tomar el pedido");
            }
        } catch (error) {
            console.error("Error claiming order:", error);
            alert("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    const updateDeliveryStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/driver/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deliveryStatus: newStatus }),
            });
            if (res.ok) {
                loadOrders(true);
            } else {
                alert("Error al actualizar estado");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    const openNavigation = (address: Order["address"]) => {
        if (!address) return;
        const query = address.latitude && address.longitude
            ? `${address.latitude},${address.longitude}`
            : `${address.street} ${address.number}, ${address.city}`;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`, "_blank");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Entregas</h1>
                    <p className="text-gray-500">Pedidos disponibles y tus entregas activas</p>
                </div>
                <button
                    onClick={() => loadOrders()}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-600"
                    title="Actualizar"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab("available")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === "available"
                            ? "bg-white shadow-sm text-green-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <Package className="w-4 h-4" />
                    Disponibles ({availableOrders.length})
                </button>
                <button
                    onClick={() => setActiveTab("my")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === "my"
                            ? "bg-white shadow-sm text-green-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <Truck className="w-4 h-4" />
                    Mis Entregas ({myDeliveries.length})
                </button>
            </div>

            {/* Available Orders Tab */}
            {activeTab === "available" && (
                <div className="space-y-4">
                    {availableOrders.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-gray-600 mb-2">No hay pedidos disponibles</h2>
                            <p className="text-gray-400 text-sm">Los pedidos listos para retirar aparecerán aquí</p>
                        </div>
                    ) : (
                        availableOrders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                {/* Order Header */}
                                <div className="px-4 py-3 bg-green-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-5 h-5 text-green-600" />
                                        <span className="font-semibold text-green-700">Listo para Retirar</span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono">{order.orderNumber}</span>
                                </div>

                                {/* Order Body */}
                                <div className="p-4">
                                    {/* Merchant Info */}
                                    {order.merchant && (
                                        <div className="mb-3 pb-3 border-b border-gray-100">
                                            <p className="text-xs text-gray-500">Retirar en:</p>
                                            <p className="font-bold text-gray-900">{order.merchant.name}</p>
                                            {order.merchant.address && (
                                                <p className="text-sm text-gray-500">{order.merchant.address}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Delivery Address */}
                                    {order.address && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500">Entregar en:</p>
                                            <p className="font-medium text-gray-900">
                                                {order.address.street} {order.address.number}
                                                {order.address.apartment && `, ${order.address.apartment}`}
                                            </p>
                                            <p className="text-sm text-gray-500">{order.address.city}</p>
                                        </div>
                                    )}

                                    {/* Customer Info */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600">{order.user?.name || "Cliente"}</p>
                                            {order.user?.phone && (
                                                <a href={`tel:${order.user.phone}`} className="text-xs text-green-600 hover:underline flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {order.user.phone}
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-lg font-bold text-green-600">{formatPrice(order.total)}</p>
                                    </div>

                                    {/* Claim Button */}
                                    <button
                                        onClick={() => claimOrder(order.id)}
                                        disabled={updating === order.id}
                                        className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                                    >
                                        {updating === order.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Truck className="w-5 h-5" />
                                        )}
                                        Tomar Pedido
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* My Deliveries Tab */}
            {activeTab === "my" && (
                <div className="space-y-4">
                    {myDeliveries.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-gray-600 mb-2">No tienes entregas activas</h2>
                            <p className="text-gray-400 text-sm">Toma un pedido de la pestaña "Disponibles"</p>
                        </div>
                    ) : (
                        myDeliveries.map((order) => {
                            const isUpdating = updating === order.id;
                            const deliveryStatus = order.deliveryStatus || "ASSIGNED";

                            return (
                                <div key={order.id} className="bg-white rounded-xl border-2 border-green-200 overflow-hidden shadow-md">
                                    {/* Order Header */}
                                    <div className="px-4 py-3 bg-green-600 text-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Truck className="w-5 h-5" />
                                            <span className="font-semibold">
                                                {deliveryStatus === "ASSIGNED" && "Retirar Pedido"}
                                                {deliveryStatus === "PICKED_UP" && "En Camino"}
                                                {deliveryStatus === "IN_TRANSIT" && "En Camino"}
                                            </span>
                                        </div>
                                        <span className="text-sm font-mono opacity-80">{order.orderNumber}</span>
                                    </div>

                                    {/* Order Body */}
                                    <div className="p-4">
                                        {/* Merchant Info (for pickup) */}
                                        {deliveryStatus === "ASSIGNED" && order.merchant && (
                                            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                <p className="text-xs font-medium text-yellow-700 mb-1">📍 RETIRAR EN:</p>
                                                <p className="font-bold text-gray-900">{order.merchant.name}</p>
                                                {order.merchant.address && (
                                                    <p className="text-sm text-gray-600">{order.merchant.address}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Delivery Address (for transit) */}
                                        {(deliveryStatus === "PICKED_UP" || deliveryStatus === "IN_TRANSIT") && order.address && (
                                            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                                <p className="text-xs font-medium text-green-700 mb-1">📍 ENTREGAR EN:</p>
                                                <p className="font-bold text-gray-900">
                                                    {order.address.street} {order.address.number}
                                                    {order.address.apartment && `, ${order.address.apartment}`}
                                                </p>
                                                <p className="text-sm text-gray-600">{order.address.city}</p>
                                            </div>
                                        )}

                                        {/* Customer Info */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{order.user?.name || "Cliente"}</p>
                                                {order.user?.phone && (
                                                    <a href={`tel:${order.user.phone}`} className="text-sm text-green-600 hover:underline flex items-center gap-1">
                                                        <Phone className="w-4 h-4" /> Llamar
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-xl font-bold text-green-600">{formatPrice(order.total)}</p>
                                        </div>

                                        {/* Items Summary */}
                                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                            <p className="text-xs font-medium text-gray-500 mb-1">Productos:</p>
                                            <ul className="text-sm text-gray-700">
                                                {order.items.map((item) => (
                                                    <li key={item.id}>{item.quantity}x {item.name}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            {/* Navigation Button */}
                                            <button
                                                onClick={() => openNavigation(order.address)}
                                                className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                            >
                                                <Navigation className="w-5 h-5" />
                                                Navegar
                                            </button>

                                            {/* Status Actions */}
                                            {deliveryStatus === "ASSIGNED" && (
                                                <button
                                                    onClick={() => updateDeliveryStatus(order.id, "PICKED_UP")}
                                                    disabled={isUpdating}
                                                    className="flex-1 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                                                >
                                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                                    Retiré
                                                </button>
                                            )}

                                            {(deliveryStatus === "PICKED_UP" || deliveryStatus === "IN_TRANSIT") && (
                                                <button
                                                    onClick={() => updateDeliveryStatus(order.id, "DELIVERED")}
                                                    disabled={isUpdating}
                                                    className="flex-1 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                                                >
                                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                                    Entregué
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
