"use client";

// Admin Order Detail Page
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/delivery";
import { formatDate, formatTime } from "@/lib/timezone";
import {
    ChevronLeft,
    Package,
    User,
    MapPin,
    Phone,
    Mail,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    Loader2,
    MessageSquare,
    AlertTriangle,
    RotateCcw,
    Repeat
} from "lucide-react";

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    subtotal: number;
    deliveryFee: number;
    total: number;
    distanceKm: number | null;
    customerNotes: string | null;
    adminNotes: string | null;
    createdAt: string;
    deliveredAt: string | null;
    driverId: string | null;
    driver: { id: string; user: { name: string } } | null;
    merchant: { id: string; name: string } | null;
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        subtotal: number;
    }>;
    address: {
        street: string;
        number: string;
        apartment: string | null;
        city: string;
    };
    user: {
        name: string;
        email: string;
        phone: string | null;
    };
}

const statusOptions = [
    { value: "PENDING", label: "Pendiente", color: "bg-yellow-500" },
    { value: "CONFIRMED", label: "Confirmado", color: "bg-blue-500" },
    { value: "PREPARING", label: "Preparando", color: "bg-purple-500" },
    { value: "READY", label: "Listo para envío", color: "bg-indigo-500" },
    { value: "IN_DELIVERY", label: "En camino", color: "bg-[#e60012]" },
    { value: "DELIVERED", label: "Entregado", color: "bg-green-500" },
    { value: "CANCELLED", label: "Cancelado", color: "bg-red-500" },
];

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");

    // Confirmation modal state
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);

    // Refund state
    const [showRefund, setShowRefund] = useState(false);
    const [refundReason, setRefundReason] = useState("");
    const [refunding, setRefunding] = useState(false);

    // Driver reassignment state
    const [showReassign, setShowReassign] = useState(false);
    const [drivers, setDrivers] = useState<Array<{ id: string; user: { name: string }; vehicleType: string; isOnline: boolean }>>([]);
    const [selectedDriver, setSelectedDriver] = useState("");
    const [reassigning, setReassigning] = useState(false);

    useEffect(() => {
        async function fetchOrder() {
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrder(data);
                    setAdminNotes(data.adminNotes || "");
                }
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchOrder();
    }, [orderId]);

    // Request status change (shows confirmation modal)
    const requestStatusChange = (newStatus: string) => {
        setPendingStatus(newStatus);
        setShowConfirm(true);
    };

    // Confirm and execute status change
    const confirmStatusChange = async () => {
        if (!order || !pendingStatus) return;
        setUpdating(true);
        setShowConfirm(false);

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: pendingStatus }),
            });

            if (response.ok) {
                const updated = await response.json();
                setOrder(updated);
            }
        } catch (error) {
            console.error("Error updating order:", error);
        } finally {
            setUpdating(false);
            setPendingStatus(null);
        }
    };

    const cancelStatusChange = () => {
        setShowConfirm(false);
        setPendingStatus(null);
    };

    const handleRefund = async () => {
        if (!order) return;
        setRefunding(true);
        try {
            const res = await fetch("/api/ops/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: order.id,
                    amount: order.total,
                    reason: refundReason || "Reembolso manual desde OPS",
                }),
            });
            if (res.ok) {
                // Refresh order data
                const orderRes = await fetch(`/api/orders/${orderId}`);
                if (orderRes.ok) {
                    const updated = await orderRes.json();
                    setOrder(updated);
                    setAdminNotes(updated.adminNotes || "");
                }
                setShowRefund(false);
                setRefundReason("");
            }
        } catch (error) {
            console.error("Error processing refund:", error);
        } finally {
            setRefunding(false);
        }
    };

    const saveAdminNotes = async () => {
        if (!order) return;
        setUpdating(true);

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminNotes }),
            });

            if (response.ok) {
                const updated = await response.json();
                setOrder(updated);
            }
        } catch (error) {
            console.error("Error saving notes:", error);
        } finally {
            setUpdating(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const res = await fetch("/api/admin/drivers");
            if (res.ok) {
                const data = await res.json();
                setDrivers(data.filter((d: any) => d.isActive));
            }
        } catch (error) {
            console.error("Error fetching drivers:", error);
        }
    };

    const handleReassign = async () => {
        if (!selectedDriver) return;
        setReassigning(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/reassign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driverId: selectedDriver }),
            });
            if (res.ok) {
                const orderRes = await fetch(`/api/orders/${orderId}`);
                if (orderRes.ok) {
                    const updated = await orderRes.json();
                    setOrder(updated);
                }
                setShowReassign(false);
                setSelectedDriver("");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setReassigning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-20">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Pedido no encontrado</p>
                <Link href="/ops/pedidos" className="btn-primary mt-4 inline-block">
                    Volver a pedidos
                </Link>
            </div>
        );
    }

    const currentStatus = statusOptions.find((s) => s.value === order.status);
    const createdAt = new Date(order.createdAt);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/ops/pedidos"
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Pedido #{order.orderNumber}
                        </h1>
                        <p className="text-gray-500">
                            {formatDate(createdAt)} - {formatTime(createdAt)}
                        </p>
                    </div>
                </div>

                <div className={`px-4 py-2 rounded-full text-white font-medium ${currentStatus?.color}`}>
                    {currentStatus?.label}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && pendingStatus && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="font-bold text-lg">Confirmar cambio de estado</h3>
                        </div>

                        <p className="text-gray-600 mb-4">
                            ¿Estás seguro de cambiar el estado del pedido <strong>#{order.orderNumber}</strong>?
                        </p>

                        <div className="flex items-center justify-center gap-3 mb-6">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium text-white ${currentStatus?.color}`}>
                                {currentStatus?.label}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium text-white ${statusOptions.find(s => s.value === pendingStatus)?.color}`}>
                                {statusOptions.find(s => s.value === pendingStatus)?.label}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={cancelStatusChange}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                disabled={updating}
                                className="flex-1 px-4 py-2 bg-[#e60012] text-white rounded-lg hover:bg-[#c5000f] transition disabled:opacity-50"
                            >
                                {updating ? "Actualizando..." : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Actions */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4">Actualizar Estado</h2>
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => requestStatusChange(status.value)}
                                    disabled={updating || order.status === status.value}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${order.status === status.value
                                        ? `${status.color} text-white`
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        } disabled:opacity-50`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-[#e60012]" />
                            Productos ({order.items.length})
                        </h2>
                        <ul className="divide-y">
                            {order.items.map((item) => (
                                <li key={item.id} className="py-4 flex justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatPrice(item.price)} x {item.quantity}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-[#e60012]">
                                        {formatPrice(item.subtotal)}
                                    </p>
                                </li>
                            ))}
                        </ul>

                        <div className="border-t pt-4 mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Envío {order.distanceKm ? `(${order.distanceKm.toFixed(1)} km)` : ""}</span>
                                <span>{order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : "GRATIS"}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold border-t pt-2">
                                <span>Total</span>
                                <span className="text-[#e60012]">{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-[#e60012]" />
                            Notas
                        </h2>

                        {order.customerNotes && (
                            <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                                <p className="text-sm font-medium text-yellow-800 mb-1">Notas del cliente:</p>
                                <p className="text-sm text-yellow-700">{order.customerNotes}</p>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                                Notas internas (solo visible para admins):
                            </label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="input resize-none"
                                rows={3}
                                placeholder="Agregar notas internas..."
                            />
                            <button
                                onClick={saveAdminNotes}
                                disabled={updating}
                                className="btn-outline mt-2 text-sm py-2"
                            >
                                {updating ? "Guardando..." : "Guardar notas"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-[#e60012]" />
                            Cliente
                        </h2>
                        <div className="space-y-3">
                            <p className="font-medium text-gray-900">{order.user.name}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {order.user.email}
                            </p>
                            {order.user.phone && (
                                <a
                                    href={`https://wa.me/${order.user.phone.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#e60012] flex items-center gap-2 hover:underline"
                                >
                                    <Phone className="w-4 h-4" />
                                    {order.user.phone}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Driver Info */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-[#e60012]" />
                            Repartidor
                        </h2>
                        {order.driver ? (
                            <div className="space-y-2">
                                <p className="font-medium text-gray-900">{order.driver.user.name}</p>
                                <button
                                    onClick={() => { fetchDrivers(); setShowReassign(true); }}
                                    className="w-full mt-2 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition flex items-center justify-center gap-2"
                                >
                                    <Repeat className="w-4 h-4" />
                                    Reasignar
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-400">Sin repartidor asignado</p>
                                <button
                                    onClick={() => { fetchDrivers(); setShowReassign(true); }}
                                    className="w-full py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2"
                                >
                                    <Truck className="w-4 h-4" />
                                    Asignar Repartidor
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Merchant Info */}
                    {order.merchant && (
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-[#e60012]" />
                                Comercio
                            </h2>
                            <Link href={`/ops/comercios/${order.merchant.id}`} className="font-medium text-[#e60012] hover:underline">
                                {order.merchant.name}
                            </Link>
                        </div>
                    )}

                    {/* Delivery Address */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[#e60012]" />
                            Dirección de Entrega
                        </h2>
                        <div className="space-y-1">
                            <p className="font-medium text-gray-900">
                                {order.address.street} {order.address.number}
                            </p>
                            {order.address.apartment && (
                                <p className="text-sm text-gray-600">{order.address.apartment}</p>
                            )}
                            <p className="text-sm text-gray-600">{order.address.city}</p>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#e60012]" />
                            Pago
                        </h2>
                        <div className="space-y-2">
                            <p className="text-sm">
                                <span className="text-gray-600">Método:</span>{" "}
                                <span className="font-medium">
                                    {order.paymentMethod === "cash" ? "Efectivo" : "Mercado Pago"}
                                </span>
                            </p>
                            <p className="text-sm">
                                <span className="text-gray-600">Estado:</span>{" "}
                                <span className={`font-medium ${order.paymentStatus === "REFUNDED" ? "text-purple-600" : order.paymentStatus === "APPROVED" ? "text-green-600" : "text-yellow-600"
                                    }`}>
                                    {order.paymentStatus === "REFUNDED" ? "Reembolsado" : order.paymentStatus === "APPROVED" ? "Pagado" : "Pendiente"}
                                </span>
                            </p>
                            {order.paymentStatus !== "REFUNDED" && (order.status === "CANCELLED" || order.paymentStatus === "APPROVED") && (
                                <button
                                    onClick={() => setShowRefund(true)}
                                    className="mt-3 w-full py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Procesar Reembolso
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reassign Driver Modal */}
            {showReassign && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-orange-500" />
                            {order?.driver ? "Reasignar Repartidor" : "Asignar Repartidor"}
                        </h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {drivers.map((driver) => (
                                <button
                                    key={driver.id}
                                    onClick={() => setSelectedDriver(driver.id)}
                                    className={`w-full p-3 rounded-lg text-left transition border ${selectedDriver === driver.id ? "border-[#e60012] bg-red-50" : "border-slate-200 hover:bg-slate-50"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{driver.user.name}</p>
                                            <p className="text-xs text-slate-500">{driver.vehicleType}</p>
                                        </div>
                                        <span className={`w-2.5 h-2.5 rounded-full ${driver.isOnline ? "bg-green-500" : "bg-slate-300"}`} />
                                    </div>
                                </button>
                            ))}
                            {drivers.length === 0 && (
                                <p className="text-center text-slate-400 py-4">No hay repartidores disponibles</p>
                            )}
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowReassign(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
                            <button onClick={handleReassign} disabled={!selectedDriver || reassigning} className="flex-1 py-2 bg-[#e60012] text-white rounded-lg hover:bg-[#c5000f] transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {reassigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {showRefund && order && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-purple-600" />
                            Procesar Reembolso
                        </h3>

                        <div className="bg-purple-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-purple-800">
                                Pedido <strong>#{order.orderNumber}</strong>
                            </p>
                            <p className="text-lg font-bold text-purple-900 mt-1">
                                {formatPrice(order.total)}
                            </p>
                            <p className="text-xs text-purple-600 mt-1">
                                {order.paymentMethod === "cash" ? "Pago en efectivo" : "MercadoPago"}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo del reembolso
                            </label>
                            <textarea
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                className="input w-full resize-none"
                                rows={3}
                                placeholder="Ej: Producto dañado, pedido no entregado..."
                            />
                        </div>

                        {order.paymentMethod === "mercadopago" && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs text-yellow-800">
                                El reembolso vía MercadoPago debe procesarse manualmente desde el panel de MP. Este registro queda como constancia interna.
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowRefund(false); setRefundReason(""); }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRefund}
                                disabled={refunding}
                                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {refunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                Confirmar Reembolso
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
