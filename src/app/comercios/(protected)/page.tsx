// Comercios Portal - Dashboard Page
import { Package, ShoppingCart, TrendingUp, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function ComerciosDashboardPage() {
    const session = await auth();
    const userName = session?.user?.name || "Comerciante";

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

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Productos Activos</p>
                            <p className="text-2xl font-bold">--</p>
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
                            <p className="text-2xl font-bold">--</p>
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
                            <p className="text-2xl font-bold">$--</p>
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
