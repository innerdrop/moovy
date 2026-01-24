"use client";

// Admin Order Detail Page
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/delivery";
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
    AlertTriangle
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
                        <h1 className="text-2xl font-bold text-navy">
                            Pedido #{order.orderNumber}
                        </h1>
                        <p className="text-gray-500">
                            {createdAt.toLocaleDateString("es-AR")} - {createdAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
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
                        <h2 className="font-bold text-navy mb-4">Actualizar Estado</h2>
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
                        <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-[#e60012]" />
                            Productos ({order.items.length})
                        </h2>
                        <ul className="divide-y">
                            {order.items.map((item) => (
                                <li key={item.id} className="py-4 flex justify-between">
                                    <div>
                                        <p className="font-medium text-navy">{item.name}</p>
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
                        <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
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
                        <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-[#e60012]" />
                            Cliente
                        </h2>
                        <div className="space-y-3">
                            <p className="font-medium text-navy">{order.user.name}</p>
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

                    {/* Delivery Address */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[#e60012]" />
                            Dirección de Entrega
                        </h2>
                        <div className="space-y-1">
                            <p className="font-medium text-navy">
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
                        <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
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
                                <span className={`font-medium ${order.paymentStatus === "APPROVED" ? "text-green-600" : "text-yellow-600"
                                    }`}>
                                    {order.paymentStatus === "APPROVED" ? "Pagado" : "Pendiente"}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
