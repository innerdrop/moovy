// Comercios Portal - Dashboard Page
import { Package, ShoppingCart, TrendingUp, Plus, Settings, Clock, AlertCircle, LayoutDashboard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { formatTime } from "@/lib/timezone";
import { prisma } from "@/lib/prisma";

export default async function ComerciosDashboardPage() {
    const session = await auth();
    const userName = session?.user?.name || "Comerciante";

    // Get merchant for this user
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: session?.user?.id },
    });

    if (!merchant) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Error de Cuenta</h2>
                <p className="text-gray-500">No tienes un comercio asociado a tu cuenta.</p>
            </div>
        );
    }

    // Get stats & recent orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [activeProducts, todayOrders, monthlyOrders, pendingOrdersCount, recentOrders] = await Promise.all([
        prisma.product.count({
            where: { merchantId: merchant.id, isActive: true },
        }),
        prisma.order.count({
            where: {
                merchantId: merchant.id,
                createdAt: { gte: today },
            },
        }),
        prisma.order.aggregate({
            where: {
                merchantId: merchant.id,
                createdAt: { gte: startOfMonth },
                paymentStatus: "APPROVED",
            },
            _sum: { total: true },
        }),
        prisma.order.count({
            where: {
                merchantId: merchant.id,
                status: { in: ["PENDING", "CONFIRMED"] },
            },
        }),
        prisma.order.findMany({
            where: { merchantId: merchant.id },
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true } }
            }
        })
    ]);

    const monthlySales = monthlyOrders._sum.total || 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 group flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-blue-600" />
                        Dashboard
                    </h1>
                    <p className="text-gray-500">Bienvenido de nuevo, <span className="text-blue-600 font-medium">{userName}</span></p>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${merchant.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        <span className={`w-2 h-2 rounded-full ${merchant.isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                        {merchant.isOpen ? "Abierto" : "Cerrado"}
                    </div>
                    <Link
                        href="/comercios/productos/nuevo"
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-sm hover:shadow-md text-sm font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden xs:inline">Nuevo Producto</span>
                    </Link>
                </div>
            </div>

            {/* Pending Orders Alert */}
            {pendingOrdersCount > 0 && (
                <Link
                    href="/comercios/pedidos"
                    className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-2xl hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Clock className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="flex-1">
                        <span className="font-bold block">Accion Requerida</span>
                        <span className="text-sm opacity-90">Tienes {pendingOrdersCount} pedido{pendingOrdersCount > 1 ? 's' : ''} pendiente{pendingOrdersCount > 1 ? 's' : ''} para gestionar.</span>
                    </div>
                    <span className="text-amber-600 font-bold hidden sm:inline">Ver pedidos &rarr;</span>
                </Link>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                        <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Productos</p>
                        <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-green-200 transition-colors">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hoy</p>
                        <p className="text-2xl font-bold text-gray-900">{todayOrders}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-purple-200 transition-colors">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ventas Mes</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">${monthlySales.toLocaleString("es-AR")}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-amber-200 transition-colors">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                        <Settings className="w-5 h-5 text-amber-600" />
                    </div>
                    <Link href="/comercios/configuracion" className="group">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuracion</p>
                        <p className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Ajustar tienda &rarr;</p>
                    </Link>
                </div>
            </div>

            {/* Main Sections Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Orders List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                            Pedidos Recientes
                        </h2>
                        <Link href="/comercios/pedidos" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                            Ver todos
                        </Link>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/comercios/pedidos`}
                                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            #{order.orderNumber.slice(-3)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{order.user?.name || "Cliente"}</p>
                                            <p className="text-xs text-gray-500">{formatTime(order.createdAt)}hs</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 text-sm">${order.total.toLocaleString("es-AR")}</p>
                                        <p className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {order.status}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400">No hay pedidos registrados aún.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                        <Package className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
                        <h3 className="text-lg font-bold mb-2">Impulsa tu tienda</h3>
                        <p className="text-blue-100 text-sm mb-6">Manten tu catalogo actualizado para aparecer en las recomendaciones de los clientes.</p>
                        <Link
                            href="/comercios/productos"
                            className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition"
                        >
                            Gestionar Catalogo &rarr;
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                            Accesos Rapidos
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <Link href="/comercios/configuracion" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Ver Perfil Publico</span>
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                            </Link>
                            <Link href="/comercios/soporte" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Ayuda y Soporte</span>
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
