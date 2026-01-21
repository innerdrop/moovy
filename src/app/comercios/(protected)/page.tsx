// Comercios Portal - Dashboard Page
import { Package, ShoppingCart, TrendingUp, Plus, Settings, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
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

    // Get real stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [activeProducts, todayOrders, monthlyOrders, pendingOrders] = await Promise.all([
        // Active products count
        prisma.product.count({
            where: { merchantId: merchant.id, isActive: true },
        }),
        // Today's orders count
        prisma.order.count({
            where: {
                merchantId: merchant.id,
                createdAt: { gte: today },
            },
        }),
        // Monthly sales
        prisma.order.aggregate({
            where: {
                merchantId: merchant.id,
                createdAt: { gte: startOfMonth },
                paymentStatus: "APPROVED",
            },
            _sum: { total: true },
        }),
        // Pending orders (needing attention)
        prisma.order.count({
            where: {
                merchantId: merchant.id,
                status: { in: ["PENDING", "CONFIRMED"] },
            },
        }),
    ]);

    const monthlySales = monthlyOrders._sum.total || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Bienvenido de nuevo, {userName}</p>
                </div>
                <Link
                    href="/comercios/productos/nuevo"
                    className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Producto
                </Link>
            </div>

            {/* Pending Orders Alert */}
            {pendingOrders > 0 && (
                <Link
                    href="/comercios/pedidos"
                    className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl hover:bg-amber-100 transition"
                >
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Tenés {pendingOrders} pedido{pendingOrders > 1 ? 's' : ''} pendiente{pendingOrders > 1 ? 's' : ''}</span>
                    <span className="ml-auto text-amber-600">Ver pedidos →</span>
                </Link>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Productos Activos</p>
                            <p className="text-2xl font-bold">{activeProducts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pedidos Hoy</p>
                            <p className="text-2xl font-bold">{todayOrders}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ventas Mes</p>
                            <p className="text-2xl font-bold">${monthlySales.toLocaleString("es-AR")}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions (Mobile Focused) */}
            <div className="grid grid-cols-2 gap-4 md:hidden">
                <Link
                    href="/comercios/productos/nuevo"
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-600 text-white rounded-xl shadow-md"
                >
                    <Plus className="w-8 h-8" />
                    <span className="font-medium">Crear Producto</span>
                </Link>
                <Link
                    href="/comercios/pedidos"
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700"
                >
                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                    <span className="font-medium">Ver Pedidos</span>
                </Link>
            </div>
        </div>
    );
}

