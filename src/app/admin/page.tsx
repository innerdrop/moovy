import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/delivery";
import Link from "next/link";
import {
    TrendingUp,
    ShoppingBag,
    Users,
    Clock,
    ArrowRight,
    Package
} from "lucide-react";

async function getMetrics() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
        ordersToday,
        salesToday,
        activeOrders,
        customersTotal,
        recentOrders
    ] = await Promise.all([
        // Orders today
        prisma.order.count({
            where: { createdAt: { gte: startOfDay } }
        }),
        // Sales today
        prisma.order.aggregate({
            where: {
                createdAt: { gte: startOfDay },
                status: { not: "CANCELLED" }
            },
            _sum: { total: true }
        }),
        // Active orders
        prisma.order.count({
            where: {
                status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY", "IN_DELIVERY"] }
            }
        }),
        // Total customers
        prisma.user.count({ where: { role: "USER" } }),
        // Recent orders list
        prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { name: true } } }
        })
    ]);

    return {
        ordersToday,
        salesToday: salesToday._sum.total || 0,
        activeOrders,
        customersTotal,
        recentOrders
    };
}

export default async function AdminDashboardPage() {
    const metrics = await getMetrics();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Bienvenido al panel de control de Moovy.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    label="Ventas Hoy"
                    value={formatPrice(metrics.salesToday)}
                    icon={TrendingUp}
                    color="text-green-600"
                    bg="bg-green-100"
                />
                <MetricCard
                    label="Pedidos Hoy"
                    value={metrics.ordersToday.toString()}
                    icon={ShoppingBag}
                    color="text-blue-600"
                    bg="bg-blue-100"
                />
                <MetricCard
                    label="Pedidos Activos"
                    value={metrics.activeOrders.toString()}
                    icon={Clock}
                    color="text-orange-600"
                    bg="bg-orange-100"
                />
                <MetricCard
                    label="Clientes Totales"
                    value={metrics.customersTotal.toString()}
                    icon={Users}
                    color="text-purple-600"
                    bg="bg-purple-100"
                />
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Pedidos Recientes</h2>
                    <Link href="/admin/orders" className="text-sm font-medium text-[#e60012] hover:underline flex items-center gap-1">
                        Ver todos <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-sm">
                                <th className="pb-3 font-medium">Orden #</th>
                                <th className="pb-3 font-medium">Cliente</th>
                                <th className="pb-3 font-medium">Estado</th>
                                <th className="pb-3 font-medium">Total</th>
                                <th className="pb-3 font-medium text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {metrics.recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400">
                                        <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        No hay pedidos recientes
                                    </td>
                                </tr>
                            ) : (
                                metrics.recentOrders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-4 font-mono font-medium text-slate-700">
                                            {order.orderNumber}
                                        </td>
                                        <td className="py-4 text-slate-600">
                                            {order.user.name || "Anonimo"}
                                        </td>
                                        <td className="py-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="py-4 font-medium text-slate-900">
                                            {formatPrice(order.total)}
                                        </td>
                                        <td className="py-4 text-right">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="text-sm font-medium text-slate-400 hover:text-[#e60012] transition-colors"
                                            >
                                                Ver detalle
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: any = {
        PENDING: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-700" },
        CONFIRMED: { label: "Confirmado", cls: "bg-blue-100 text-blue-700" },
        PREPARING: { label: "Preparando", cls: "bg-purple-100 text-purple-700" },
        READY: { label: "Listo", cls: "bg-indigo-100 text-indigo-700" },
        IN_DELIVERY: { label: "En Camino", cls: "bg-orange-100 text-orange-700" },
        DELIVERED: { label: "Entregado", cls: "bg-green-100 text-green-700" },
        CANCELLED: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
    };

    const conf = config[status] || { label: status, cls: "bg-gray-100 text-gray-700" };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${conf.cls}`}>
            {conf.label}
        </span>
    );
}
