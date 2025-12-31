// Admin Dashboard - Panel Principal
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/delivery";
import {
    Package,
    ShoppingCart,
    Users,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    Clock,
    CheckCircle
} from "lucide-react";
import Link from "next/link";

async function getStats() {
    try {
        const [
            totalProducts,
            lowStockProducts,
            totalOrders,
            pendingOrders,
            totalUsers,
            settings
        ] = await Promise.all([
            prisma.product.count({ where: { isActive: true } }),
            prisma.product.count({ where: { isActive: true, stock: { lte: 5 } } }),
            prisma.order.count(),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.user.count({ where: { role: "USER" } }),
            prisma.storeSettings.findUnique({ where: { id: "settings" } }),
        ]);

        return {
            totalProducts,
            lowStockProducts,
            totalOrders,
            pendingOrders,
            totalUsers,
            isStoreOpen: settings?.isOpen ?? true,
        };
    } catch (error) {
        return {
            totalProducts: 0,
            lowStockProducts: 0,
            totalOrders: 0,
            pendingOrders: 0,
            totalUsers: 0,
            isStoreOpen: true,
        };
    }
}

async function getRecentOrders() {
    try {
        const orders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, email: true } },
            },
        });
        return orders;
    } catch (error) {
        return [];
    }
}

export default async function AdminDashboard() {
    const stats = await getStats();
    const recentOrders = await getRecentOrders();

    const statCards = [
        {
            title: "Productos",
            value: stats.totalProducts,
            icon: Package,
            color: "bg-blue-500",
            href: "/admin/productos",
        },
        {
            title: "Pedidos Pendientes",
            value: stats.pendingOrders,
            icon: Clock,
            color: "bg-yellow-500",
            href: "/admin/pedidos?estado=pendiente",
        },
        {
            title: "Total Pedidos",
            value: stats.totalOrders,
            icon: ShoppingCart,
            color: "bg-green-500",
            href: "/admin/pedidos",
        },
        {
            title: "Clientes",
            value: stats.totalUsers,
            icon: Users,
            color: "bg-purple-500",
            href: "/admin/clientes",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
                    <p className="text-gray-600">Bienvenido al panel de administración</p>
                </div>

                {/* Store Status */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${stats.isStoreOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    <span className={`w-3 h-3 rounded-full ${stats.isStoreOpen ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="font-medium">
                        Tienda {stats.isStoreOpen ? "Abierta" : "Cerrada"}
                    </span>
                    <Link
                        href="/admin/configuracion"
                        className="text-xs underline ml-2"
                    >
                        Cambiar
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <Link
                        key={card.title}
                        href={card.href}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">{card.title}</p>
                                <p className="text-3xl font-bold text-navy mt-1">{card.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${card.color}`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Alerts */}
            {stats.lowStockProducts > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-800">Stock Bajo</h3>
                        <p className="text-yellow-700 text-sm">
                            Hay {stats.lowStockProducts} productos con stock bajo.{" "}
                            <Link href="/admin/productos?stock=bajo" className="underline">
                                Ver productos
                            </Link>
                        </p>
                    </div>
                </div>
            )}

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-lg font-bold text-navy">Pedidos Recientes</h2>
                    <Link href="/admin/pedidos" className="text-turquoise text-sm hover:underline">
                        Ver todos →
                    </Link>
                </div>

                {recentOrders.length > 0 ? (
                    <div className="divide-y">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === "DELIVERED" ? "bg-green-100" :
                                            order.status === "PENDING" ? "bg-yellow-100" :
                                                "bg-blue-100"
                                        }`}>
                                        {order.status === "DELIVERED" ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : order.status === "PENDING" ? (
                                            <Clock className="w-5 h-5 text-yellow-600" />
                                        ) : (
                                            <Package className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-navy">{order.orderNumber}</p>
                                        <p className="text-sm text-gray-500">{order.user?.name || "Cliente"}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-turquoise">{formatPrice(order.total)}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString("es-AR")}
                                    </p>
                                </div>
                            </div>
                        ))}
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
