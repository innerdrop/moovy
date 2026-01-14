
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Store, ShoppingBag, DollarSign, Clock, UtensilsCrossed, Settings } from "lucide-react";
import Link from "next/link";

async function getMerchantStats(userId: string) {
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId },
        include: {
            _count: {
                select: {
                    orders: true,
                    products: true
                }
            }
        }
    });

    if (!merchant) return null;

    // TODO: Calculate real revenue
    return {
        merchant,
        ordersCount: merchant._count.orders,
        productsCount: merchant._count.products,
        revenue: 0
    };
}

export default async function PartnerDashboard() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const data = await getMerchantStats(session.user.id);

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Store className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido a Moovy Partners!</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    Aún no tienes un comercio vinculado a tu cuenta. Contacta a soporte para dar de alta tu tienda.
                </p>
            </div>
        );
    }

    const { merchant, ordersCount, productsCount, revenue } = data;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hola, {merchant.name} 👋</h1>
                    <p className="text-gray-500">Aquí tienes el resumen de tu negocio hoy.</p>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${merchant.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${merchant.isOpen ? 'bg-green-600' : 'bg-red-600'}`} />
                        {merchant.isOpen ? 'Abierto' : 'Cerrado'}
                    </span>
                    <Link href="/partner/configuracion" className="btn-secondary text-sm">
                        Cambiar Estado
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Pedidos Totales</p>
                            <h3 className="text-2xl font-bold text-gray-900">{ordersCount}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Ventas del Mes</p>
                            <h3 className="text-2xl font-bold text-gray-900">${revenue.toLocaleString('es-AR')}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                            <UtensilsCrossed className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Productos Activos</p>
                            <h3 className="text-2xl font-bold text-gray-900">{productsCount}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Tiempo Promedio</p>
                            <h3 className="text-2xl font-bold text-gray-900">{merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Recent Orders Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">Últimos Pedidos</h3>
                        <Link href="/partner/pedidos" className="text-sm text-[#e60012] font-medium hover:underline">
                            Ver todos
                        </Link>
                    </div>

                    <div className="text-center py-10 text-gray-400">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay pedidos recientes.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-6">Acciones Rápidas</h3>
                    <div className="space-y-3">
                        <Link href="/partner/productos/nuevo" className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#e60012] hover:text-[#e60012] transition font-medium">
                            <UtensilsCrossed className="w-4 h-4" />
                            Agregar Producto
                        </Link>
                        <Link href="/partner/configuracion" className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#e60012] hover:text-[#e60012] transition font-medium">
                            <Settings className="w-4 h-4" />
                            Editar Tienda
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
