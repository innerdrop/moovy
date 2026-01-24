"use client";

// Admin Orders Page - Gestión de Pedidos con eliminación y backup
import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Package,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    ChevronRight,
    User,
    MapPin,
    Phone,
    Trash2,
    Loader2,
    X,
    Download,
    Check,
    Home
} from "lucide-react";
import { formatPrice } from "@/lib/delivery";

// Status configuration
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
    CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
    PREPARING: { label: "Preparando", color: "bg-purple-100 text-purple-800", icon: <Package className="w-4 h-4" /> },
    READY: { label: "Listo", color: "bg-indigo-100 text-indigo-800", icon: <Package className="w-4 h-4" /> },
    IN_DELIVERY: { label: "En camino", color: "bg-orange-100 text-orange-800", icon: <Truck className="w-4 h-4" /> },
    DELIVERED: { label: "Entregado", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
    CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
};

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    user: { id: string; name: string; email: string; phone: string | null };
    items: any[];
    address: { street: string; number: string; city: string } | null;
    driver: { user: { name: string } } | null;
    merchant: { id: string; name: string } | null;
}

export default function AdminPedidosPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [createBackup, setCreateBackup] = useState(true);
    const [backupName, setBackupName] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    async function fetchOrders() {
        try {
            const res = await fetch(`/api/admin/orders?status=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }

    function toggleSelectOrder(orderId: string) {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    }

    function toggleSelectAll() {
        if (selectedOrders.length === orders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders.map(o => o.id));
        }
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            const res = await fetch("/api/admin/orders", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderIds: selectedOrders,
                    createBackup,
                    backupName: backupName || undefined
                })
            });

            if (res.ok) {
                setShowDeleteModal(false);
                setSelectedOrders([]);
                setBackupName("");
                fetchOrders();
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setDeleting(false);
        }
    }

    const stats = {
        pending: orders.filter(o => o.status === "PENDING").length,
        inProgress: orders.filter(o => ["CONFIRMED", "PREPARING", "READY", "IN_DELIVERY"].includes(o.status)).length,
        delivered: orders.filter(o => o.status === "DELIVERED").length,
        today: orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Pedidos</h1>
                    <p className="text-gray-600">Gestiona los pedidos de tus clientes</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/ops" className="btn-secondary flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Inicio
                    </Link>
                    {selectedOrders.length > 0 && (
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar ({selectedOrders.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-800">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-sm text-blue-800">En proceso</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.inProgress}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-sm text-green-800">Entregados</p>
                    <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm text-purple-800">Hoy</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.today}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { value: "all", label: "Todos" },
                    { value: "PENDING", label: "Pendientes" },
                    { value: "CONFIRMED", label: "Confirmados" },
                    { value: "PREPARING", label: "Preparando" },
                    { value: "IN_DELIVERY", label: "En camino" },
                    { value: "DELIVERED", label: "Entregados" },
                    { value: "CANCELLED", label: "Cancelados" },
                ].map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === f.value
                                ? "bg-[#e60012] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay pedidos</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Select All */}
                    <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={selectedOrders.length === orders.length && orders.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-[#e60012] focus:ring-[#e60012]"
                        />
                        <span className="text-sm text-gray-600">
                            {selectedOrders.length > 0
                                ? `${selectedOrders.length} seleccionado(s)`
                                : "Seleccionar todos"
                            }
                        </span>
                    </div>

                    <div className="divide-y">
                        {orders.map((order) => {
                            const status = statusConfig[order.status] || statusConfig.PENDING;
                            const isSelected = selectedOrders.includes(order.id);

                            return (
                                <div
                                    key={order.id}
                                    className={`p-4 hover:bg-gray-50 transition ${isSelected ? "bg-red-50" : ""}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelectOrder(order.id)}
                                            className="w-4 h-4 mt-1 rounded border-gray-300 text-[#e60012] focus:ring-[#e60012]"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="font-bold text-navy">#{order.orderNumber}</span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleString("es-AR")}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {order.user.name || order.user.email}
                                                </span>
                                                {order.address && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {order.address.street} {order.address.number}
                                                    </span>
                                                )}
                                                {order.driver && (
                                                    <span className="flex items-center gap-1">
                                                        <Truck className="w-4 h-4" />
                                                        {order.driver.user.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold text-navy">{formatPrice(order.total)}</p>
                                            <p className="text-xs text-gray-500">{order.items.length} items</p>
                                        </div>

                                        <Link
                                            href={`/ops/pedidos/${order.id}`}
                                            className="p-2 text-gray-400 hover:text-[#e60012] hover:bg-gray-100 rounded-lg transition"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-navy">Eliminar Pedidos</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-4">
                            ¿Estás seguro de eliminar {selectedOrders.length} pedido(s)?
                            Esta acción no se puede deshacer.
                        </p>

                        {/* Backup Option */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                <input
                                    type="checkbox"
                                    checked={createBackup}
                                    onChange={(e) => setCreateBackup(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#e60012] focus:ring-[#e60012]"
                                />
                                <div>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        Crear copia de seguridad
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Guarda los datos antes de eliminar
                                    </p>
                                </div>
                            </label>

                            {createBackup && (
                                <div>
                                    <label className="text-sm text-gray-700 mb-1 block">
                                        Nombre del backup (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={backupName}
                                        onChange={(e) => setBackupName(e.target.value)}
                                        placeholder={`backup-${new Date().toISOString().slice(0, 10)}`}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e60012]"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-5 h-5" />
                                )}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
