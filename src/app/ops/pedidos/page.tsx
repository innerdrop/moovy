// Admin Orders Page - Gestión de Pedidos
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/delivery";
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
    Phone
} from "lucide-react";

// Status configuration
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
    CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
    PREPARING: { label: "Preparando", color: "bg-purple-100 text-purple-800", icon: <Package className="w-4 h-4" /> },
    READY: { label: "Listo", color: "bg-indigo-100 text-indigo-800", icon: <Package className="w-4 h-4" /> },
    IN_DELIVERY: { label: "En camino", color: "bg-[#e60012] text-[#e60012]", icon: <Truck className="w-4 h-4" /> },
    DELIVERED: { label: "Entregado", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
    CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
};

async function getOrders(status?: string) {
    const where: any = {};
    if (status && status !== 'all') {
        where.status = status;
    }

    const orders = await prisma.order.findMany({
        where,
        include: {
            items: true,
            address: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
            driver: { select: { id: true, user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return orders;
}

async function getOrderStats() {
    const [pending, inProgress, delivered, today] = await Promise.all([
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: { in: ["CONFIRMED", "PREPARING", "READY", "IN_DELIVERY"] } } }),
        prisma.order.count({ where: { status: "DELIVERED" } }),
        prisma.order.count({
            where: {
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
        }),
    ]);

    return { pending, inProgress, delivered, today };
}

interface PageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function AdminPedidosPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const orders = await getOrders(params.status);
    const stats = await getOrderStats();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Pedidos</h1>
                    <p className="text-gray-600">Gestiona los pedidos de tus clientes</p>
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
                ].map((filter) => (
                    <Link
                        key={filter.value}
                        href={`/admin/pedidos?status=${filter.value}`}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${(params.status || "all") === filter.value
                                ? "bg-moovy text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {filter.label}
                    </Link>
                ))}
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay pedidos {params.status ? "con este estado" : ""}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig.PENDING;
                        const createdAt = new Date(order.createdAt);

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
                            >
                                <div className="p-4 sm:p-6">
                                    {/* Order Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-navy text-lg">
                                                    #{order.orderNumber}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {createdAt.toLocaleDateString("es-AR")} a las{" "}
                                                {createdAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-moovy">
                                                {formatPrice(order.total)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Customer & Address */}
                                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                                        <div className="flex items-start gap-3">
                                            <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-navy">{order.user.name}</p>
                                                <p className="text-sm text-gray-500">{order.user.email}</p>
                                                {order.user.phone && (
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {order.user.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-navy">
                                                    {order.address.street} {order.address.number}
                                                </p>
                                                {order.address.apartment && (
                                                    <p className="text-sm text-gray-500">{order.address.apartment}</p>
                                                )}
                                                <p className="text-sm text-gray-500">{order.address.city}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Preview */}
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm text-gray-600 mb-2">Productos:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {order.items.slice(0, 3).map((item) => (
                                                <span
                                                    key={item.id}
                                                    className="text-xs bg-gray-100 px-2 py-1 rounded"
                                                >
                                                    {item.quantity}x {item.name}
                                                </span>
                                            ))}
                                            {order.items.length > 3 && (
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    +{order.items.length - 3} más
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 pt-4 border-t flex justify-end">
                                        <Link
                                            href={`/admin/pedidos/${order.id}`}
                                            className="btn-outline py-2 px-4 text-sm inline-flex items-center gap-2"
                                        >
                                            Ver detalle
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

