// Comercios Portal - Dashboard Page
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Store, Package, ShoppingCart, Settings, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";

export default async function ComerciosDashboardPage() {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!session || !["MERCHANT", "ADMIN"].includes(role)) {
        redirect("/login");
    }

    const userName = session.user?.name || "Comerciante";

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Store className="w-8 h-8" />
                        Panel de Comercio
                    </h1>
                    <p className="text-blue-100 mt-1">Bienvenido, {userName}</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Productos</p>
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
                                <p className="text-sm text-gray-500">Ventas del Mes</p>
                                <p className="text-2xl font-bold">$--</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link
                            href="/productos/nuevo"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                            <Plus className="w-8 h-8 text-blue-600" />
                            <span className="text-sm font-medium">Nuevo Producto</span>
                        </Link>
                        <Link
                            href="/pedidos"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                            <ShoppingCart className="w-8 h-8 text-blue-600" />
                            <span className="text-sm font-medium">Ver Pedidos</span>
                        </Link>
                        <Link
                            href="/productos"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                            <Package className="w-8 h-8 text-blue-600" />
                            <span className="text-sm font-medium">Mis Productos</span>
                        </Link>
                        <Link
                            href="/configuracion"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                            <Settings className="w-8 h-8 text-blue-600" />
                            <span className="text-sm font-medium">Configuración</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
