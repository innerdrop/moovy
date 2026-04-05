// Admin Dashboard - Panel Principal
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/delivery";
import {
    Package,
    ShoppingCart,
    Users,
    DollarSign,
    Clock,
    CheckCircle,
    Truck,
    Store,
    AlertTriangle,
    TrendingUp,
    Activity,
    UserPlus,
} from "lucide-react";
import Link from "next/link";

async function getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        const [
            totalBuyers,
            newBuyersToday,
            totalMerchants,
            totalDrivers,
            totalSellers,
            totalOrders,
            pendingOrders,
            activeOrders,
            ordersToday,
            ordersYesterday,
            deliveredToday,
            revenueToday,
            revenueMonth,
            driversOnline,
            driversTotal,
            merchantsOpen,
            merchantsTotal,
            unassignedOrders,
            totalProducts,
            totalListings,
            openSupportChats,
        ] = await Promise.all([
            // Buyers: users with role USER that don't have ADMIN/COMERCIO/DRIVER/SELLER roles
            prisma.user.count({
                where: {
                    role: "USER",
                    roles: { none: { role: { in: ["ADMIN", "COMERCIO", "DRIVER", "SELLER"] } } },
                    deletedAt: null,
                },
            }),
            prisma.user.count({
                where: {
                    role: "USER",
                    roles: { none: { role: { in: ["ADMIN", "COMERCIO", "DRIVER", "SELLER"] } } },
                    deletedAt: null,
                    createdAt: { gte: todayStart },
                },
            }),
            // Role counts for subtitle
            prisma.merchant.count({ where: { isActive: true } }),
            prisma.driver.count({ where: { isActive: true } }),
            prisma.sellerProfile.count(),
            // Orders
            prisma.order.count(),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.order.count({
                where: { status: { in: ["CONFIRMED", "PREPARING", "READY", "IN_DELIVERY"] } },
            }),
            prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
            prisma.order.count({
                where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
            }),
            prisma.order.count({
                where: { status: "DELIVERED", deliveredAt: { gte: todayStart } },
            }),
            // Revenue
            prisma.order.aggregate({
                where: { createdAt: { gte: todayStart }, paymentStatus: "PAID" },
                _sum: { total: true },
            }),
            prisma.order.aggregate({
                where: { createdAt: { gte: monthStart }, paymentStatus: "PAID" },
                _sum: { total: true },
            }),
            // Drivers
            prisma.driver.count({ where: { isOnline: true, isActive: true } }),
            prisma.driver.count({ where: { isActive: true } }),
            // Merchants
            prisma.merchant.count({ where: { isOpen: true, isActive: true } }),
            prisma.merchant.count({ where: { isActive: true } }),
            // Unassigned
            prisma.order.count({
                where: { status: "CONFIRMED", driverId: null },
            }),
            // Catalog
            prisma.product.count({ where: { isActive: true } }),
            prisma.listing.count({ where: { isActive: true } }),
            // Support
            prisma.supportChat.count({ where: { status: "open" } }),
        ]);

        return {
            totalBuyers,
            newBuyersToday,
            totalMerchants,
            totalDrivers,
            totalSellers,
            totalOrders,
            pendingOrders,
            activeOrders,
            ordersToday,
            ordersYesterday,
            deliveredToday,
            revenueToday: revenueToday._sum.total || 0,
            revenueMonth: revenueMonth._sum.total || 0,
            driversOnline,
            driversTotal,
            merchantsOpen,
            merchantsTotal,
            unassignedOrders,
            totalProducts,
            totalListings,
            openSupportChats,
        };
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return {
            totalBuyers: 0, newBuyersToday: 0, totalMerchants: 0, totalDrivers: 0,
            totalSellers: 0, totalOrders: 0, pendingOrders: 0,
            activeOrders: 0, ordersToday: 0, ordersYesterday: 0, deliveredToday: 0,
            revenueToday: 0, revenueMonth: 0, driversOnline: 0, driversTotal: 0,
            merchantsOpen: 0, merchantsTotal: 0, unassignedOrders: 0,
            totalProducts: 0, totalListings: 0, openSupportChats: 0,
        };
    }
}

async function getRecentOrders() {
    try {
        return await prisma.order.findMany({
            take: 8,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true } },
                merchant: { select: { name: true } },
            },
        });
    } catch {
        return [];
    }
}

const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
    PREPARING: { label: "Preparando", color: "bg-indigo-100 text-indigo-700" },
    READY: { label: "Listo", color: "bg-cyan-100 text-cyan-700" },
    IN_DELIVERY: { label: "En camino", color: "bg-orange-100 text-orange-700" },
    DELIVERED: { label: "Entregado", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export default async function AdminDashboard() {
    const stats = await getStats();
    const recentOrders = await getRecentOrders();

    const ordersTrend = stats.ordersYesterday > 0
        ? Math.round(((stats.ordersToday - stats.ordersYesterday) / stats.ordersYesterday) * 100)
        : stats.ordersToday > 0 ? 100 : 0;

    // Alerts
    const alerts: { message: string; href: string; type: "warning" | "danger" }[] = [];
    if (stats.unassignedOrders > 0) {
        alerts.push({
            message: `${stats.unassignedOrders} pedido${stats.unassignedOrders > 1 ? "s" : ""} sin repartidor asignado`,
            href: "/ops/live",
            type: "danger",
        });
    }
    if (stats.driversOnline === 0 && stats.activeOrders > 0) {
        alerts.push({
            message: "No hay repartidores online con pedidos activos",
            href: "/ops/repartidores",
            type: "danger",
        });
    }
    if (stats.openSupportChats > 0) {
        alerts.push({
            message: `${stats.openSupportChats} chat${stats.openSupportChats > 1 ? "s" : ""} de soporte sin responder`,
            href: "/ops/soporte",
            type: "warning",
        });
    }
    if (stats.pendingOrders > 5) {
        alerts.push({
            message: `${stats.pendingOrders} pedidos pendientes de confirmación`,
            href: "/ops/pedidos?estado=pendiente",
            type: "warning",
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 text-sm">
                        {new Date().toLocaleDateString("es-AR", {
                            weekday: "long", day: "numeric", month: "long", year: "numeric",
                        })}
                    </p>
                </div>
                <Link
                    href="/ops/live"
                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition text-sm font-medium shadow-sm ${
                        stats.activeOrders > 0
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-slate-500 hover:bg-slate-600"
                    }`}
                >
                    {stats.activeOrders > 0 ? (
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-200" />
                        </span>
                    ) : (
                        <Activity className="w-4 h-4 opacity-70" />
                    )}
                    {stats.activeOrders > 0
                        ? `En vivo · ${stats.activeOrders} pedido${stats.activeOrders > 1 ? "s" : ""}`
                        : "En vivo"
                    }
                </Link>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, i) => (
                        <Link
                            key={i}
                            href={alert.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition hover:shadow-sm ${
                                alert.type === "danger"
                                    ? "bg-red-50 border-red-200 text-red-800"
                                    : "bg-amber-50 border-amber-200 text-amber-800"
                            }`}
                        >
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">{alert.message}</span>
                            <span className="ml-auto text-xs opacity-60">Ver →</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Top KPIs - Revenue + Orders Today */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.revenueToday)}</p>
                    <p className="text-xs text-gray-500 mt-1">Facturado hoy</p>
                    <p className="text-xs text-gray-400 mt-0.5">Mes: {formatPrice(stats.revenueMonth)}</p>
                </div>

                <Link href="/ops/pedidos" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                        </div>
                        {ordersTrend !== 0 && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                ordersTrend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                                {ordersTrend > 0 ? "+" : ""}{ordersTrend}%
                            </span>
                        )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.ordersToday}</p>
                    <p className="text-xs text-gray-500 mt-1">Pedidos hoy</p>
                    <p className="text-xs text-gray-400 mt-0.5">Ayer: {stats.ordersYesterday}</p>
                </Link>

                <Link href="/ops/pedidos" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        {stats.activeOrders > 0 && (
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                            </span>
                        )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">En curso ahora</p>
                    <p className="text-xs text-gray-400 mt-0.5">Entregados hoy: {stats.deliveredToday}</p>
                </Link>

                <Link href="/ops/clientes" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Users className="w-5 h-5 text-red-600" />
                        </div>
                        {stats.newBuyersToday > 0 && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                +{stats.newBuyersToday} hoy
                            </span>
                        )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBuyers}</p>
                    <p className="text-xs text-gray-500 mt-1">Compradores</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {stats.totalMerchants} comercio{stats.totalMerchants !== 1 ? "s" : ""} · {stats.totalDrivers} repartidor{stats.totalDrivers !== 1 ? "es" : ""}{stats.totalSellers > 0 ? ` · ${stats.totalSellers} vendedor${stats.totalSellers !== 1 ? "es" : ""}` : ""}
                    </p>
                </Link>
            </div>

            {/* Operational Status */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/ops/repartidores" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stats.driversOnline > 0 ? "bg-green-100" : "bg-gray-100"}`}>
                            <Truck className={`w-5 h-5 ${stats.driversOnline > 0 ? "text-green-600" : "text-gray-400"}`} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">{stats.driversOnline}<span className="text-sm font-normal text-gray-400">/{stats.driversTotal}</span></p>
                            <p className="text-xs text-gray-500">Repartidores online</p>
                        </div>
                    </div>
                </Link>

                <Link href="/ops/comercios" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stats.merchantsOpen > 0 ? "bg-green-100" : "bg-gray-100"}`}>
                            <Store className={`w-5 h-5 ${stats.merchantsOpen > 0 ? "text-green-600" : "text-gray-400"}`} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">{stats.merchantsOpen}<span className="text-sm font-normal text-gray-400">/{stats.merchantsTotal}</span></p>
                            <p className="text-xs text-gray-500">Comercios abiertos</p>
                        </div>
                    </div>
                </Link>

                <Link href="/ops/productos" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">{stats.totalProducts}</p>
                            <p className="text-xs text-gray-500">Productos activos</p>
                        </div>
                    </div>
                </Link>

                <Link href="/ops/moderacion" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">{stats.totalListings}</p>
                            <p className="text-xs text-gray-500">Listings marketplace</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">Últimos pedidos</h2>
                    <Link href="/ops/pedidos" className="text-moovy text-sm hover:underline font-medium">
                        Ver todos →
                    </Link>
                </div>

                {recentOrders.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {recentOrders.map((order) => {
                            const st = statusLabels[order.status] || { label: order.status, color: "bg-gray-100 text-gray-700" };
                            return (
                                <Link
                                    key={order.id}
                                    href={`/ops/pedidos/${order.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            order.status === "DELIVERED" ? "bg-green-100" :
                                            order.status === "PENDING" ? "bg-yellow-100" :
                                            order.status === "CANCELLED" ? "bg-red-100" :
                                            "bg-blue-100"
                                        }`}>
                                            {order.status === "DELIVERED" ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : order.status === "PENDING" ? (
                                                <Clock className="w-4 h-4 text-yellow-600" />
                                            ) : (
                                                <Package className="w-4 h-4 text-blue-600" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 text-sm">{order.orderNumber}</p>
                                            <p className="text-xs text-gray-400 truncate">
                                                {order.user?.name || "Cliente"} • {order.merchant?.name || "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                                            {st.label}
                                        </span>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-gray-900">{formatPrice(order.total)}</p>
                                            <p className="text-[10px] text-gray-400">
                                                {new Date(order.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No hay pedidos todavía</p>
                    </div>
                )}
            </div>
        </div>
    );
}
