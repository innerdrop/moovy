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
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <Package className="w-20 h-20 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium text-lg">No hay pedidos registrados</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Select All / Bulk Actions */}
                    <div className="px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedOrders.length === orders.length && orders.length > 0}
                                onChange={toggleSelectAll}
                                className="w-5 h-5 rounded border-slate-300 text-moovy focus:ring-moovy transition-all"
                            />
                            <span className="text-sm font-bold text-navy uppercase tracking-wider">
                                {selectedOrders.length > 0
                                    ? `${selectedOrders.length} seleccionado(s)`
                                    : "Seleccionar todos"
                                }
                            </span>
                        </label>

                        {selectedOrders.length > 0 && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar Selección
                            </button>
                        )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 w-12"></th>
                                    <th className="text-left p-4 font-bold text-navy text-xs uppercase tracking-widest">Pedido</th>
                                    <th className="text-left p-4 font-bold text-navy text-xs uppercase tracking-widest">Cliente</th>
                                    <th className="text-center p-4 font-bold text-navy text-xs uppercase tracking-widest">Estado</th>
                                    <th className="text-right p-4 font-bold text-navy text-xs uppercase tracking-widest">Total</th>
                                    <th className="p-4 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders.map((order) => {
                                    const status = statusConfig[order.status] || statusConfig.PENDING;
                                    const isSelected = selectedOrders.includes(order.id);

                                    return (
                                        <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-red-50/30" : ""}`}>
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectOrder(order.id)}
                                                    className="w-5 h-5 rounded border-slate-300 text-moovy focus:ring-moovy transition-all"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold text-navy">#{order.orderNumber}</span>
                                                    <span className="text-[11px] text-slate-400 font-medium">
                                                        {new Date(order.createdAt).toLocaleString("es-AR")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                        {(order.user.name || order.user.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800 text-sm line-clamp-1">{order.user.name || order.user.email}</span>
                                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {order.address?.street || "Sin dirección"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="font-extrabold text-navy">{formatPrice(order.total)}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Link
                                                    href={`/ops/pedidos/${order.id}`}
                                                    className="inline-flex items-center justify-center w-10 h-10 bg-slate-50 text-slate-400 hover:text-moovy hover:bg-red-50 rounded-xl transition-all border border-slate-100"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View: Premium Cards */}
                    <div className="md:hidden space-y-4">
                        {orders.map((order) => {
                            const status = statusConfig[order.status] || statusConfig.PENDING;
                            const isSelected = selectedOrders.includes(order.id);

                            return (
                                <div
                                    key={order.id}
                                    className={`bg-white rounded-2xl shadow-sm border p-4 transition-all relative overflow-hidden ${isSelected ? "border-moovy ring-1 ring-moovy bg-red-50/20" : "border-slate-100"}`}
                                >
                                    {/* Action Row */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelectOrder(order.id)}
                                                className="w-6 h-6 rounded-lg border-slate-300 text-moovy focus:ring-moovy"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID PEDIDO</span>
                                                <span className="font-extrabold text-navy text-lg line-height-none">#{order.orderNumber}</span>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-moovy border border-slate-200 shadow-sm font-black text-sm">
                                            {(order.user.name || order.user.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-navy truncate">{order.user.name || order.user.email}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate">{order.address?.street} {order.address?.number}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total abonado</span>
                                            <span className="font-black text-xl text-moovy">{formatPrice(order.total)}</span>
                                        </div>
                                        <Link
                                            href={`/ops/pedidos/${order.id}`}
                                            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                                        >
                                            Ver detalles
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    {/* Decoration Line */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.color.split(' ')[0].replace('-50', '-500').replace('-100', '-500')}`}></div>
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
