// Vendedor Portal - Dashboard Page
import {
    Tag,
    ShoppingCart,
    TrendingUp,
    Star,
    Plus,
    LayoutDashboard,
    ArrowRight,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AvailabilityToggle from "@/components/seller/AvailabilityToggle";

export default async function VendedorDashboardPage() {
    const session = await auth();
    const userName = session?.user?.name || "Vendedor";

    // Get seller profile for this user
    const seller = await prisma.sellerProfile.findUnique({
        where: { userId: session?.user?.id },
    });

    if (!seller) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Error de Cuenta</h2>
                <p className="text-gray-500">No tenés un perfil de vendedor asociado a tu cuenta.</p>
                <Link
                    href="/mi-perfil"
                    className="inline-block mt-4 text-emerald-600 font-bold hover:underline"
                >
                    Ir a mi perfil →
                </Link>
            </div>
        );
    }

    // Get stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [activeListings, monthlySales, monthlyEarnings, recentListings] = await Promise.all([
        // Total active listings
        prisma.listing.count({
            where: { sellerId: seller.id, isActive: true },
        }),
        // Sales this month (delivered SubOrders)
        prisma.subOrder.count({
            where: {
                sellerId: seller.id,
                status: "DELIVERED",
                createdAt: { gte: startOfMonth },
            },
        }),
        // Earnings this month (sum of sellerPayout)
        prisma.subOrder.aggregate({
            where: {
                sellerId: seller.id,
                status: "DELIVERED",
                createdAt: { gte: startOfMonth },
            },
            _sum: { sellerPayout: true },
        }),
        // Last 5 listings published
        prisma.listing.findMany({
            where: { sellerId: seller.id },
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                category: { select: { name: true } },
                _count: { select: { images: true } },
            },
        }),
    ]);

    const totalEarnings = monthlyEarnings._sum.sellerPayout || 0;

    const conditionLabel: Record<string, { text: string; color: string }> = {
        NUEVO: { text: "Nuevo", color: "bg-green-100 text-green-700" },
        USADO: { text: "Usado", color: "bg-orange-100 text-orange-700" },
        REACONDICIONADO: { text: "Reacondicionado", color: "bg-blue-100 text-blue-700" },
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 group flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-emerald-600" />
                        Dashboard
                    </h1>
                    <p className="text-gray-500">Bienvenido de nuevo, <span className="text-emerald-600 font-medium">{userName}</span></p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/vendedor/listings"
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition shadow-sm hover:shadow-md text-sm font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden xs:inline">Nueva Listing</span>
                    </Link>
                </div>
            </div>

            {/* Availability Toggle */}
            <AvailabilityToggle />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-emerald-200 transition-colors">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                        <Tag className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Listings Activas</p>
                        <p className="text-2xl font-bold text-gray-900">{activeListings}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-green-200 transition-colors">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ventas del Mes</p>
                        <p className="text-2xl font-bold text-gray-900">{monthlySales}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-purple-200 transition-colors">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ganancias Mes</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">${totalEarnings.toLocaleString("es-AR")}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-yellow-200 transition-colors">
                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                        <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating</p>
                        <div className="flex items-center gap-1">
                            <p className="text-2xl font-bold text-gray-900">
                                {seller.rating ? seller.rating.toFixed(1) : "—"}
                            </p>
                            {seller.rating && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Sections Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Listings */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-emerald-600" />
                            Últimas Listings
                        </h2>
                        <Link href="/vendedor/listings" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                            Ver todas
                        </Link>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {recentListings.length > 0 ? (
                            recentListings.map((listing) => {
                                const cond = conditionLabel[listing.condition] || { text: listing.condition, color: "bg-gray-100 text-gray-700" };
                                return (
                                    <div
                                        key={listing.id}
                                        className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 line-clamp-1">{listing.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cond.color}`}>
                                                        {cond.text}
                                                    </span>
                                                    {listing.category && (
                                                        <span className="text-[10px] text-gray-400">{listing.category.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 text-sm">${listing.price.toLocaleString("es-AR")}</p>
                                            <p className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${listing.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                {listing.isActive ? "Activa" : "Inactiva"}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-12 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400">No tenés listings publicadas aún.</p>
                                <Link
                                    href="/vendedor/listings"
                                    className="inline-block mt-3 text-emerald-600 font-bold text-sm hover:underline"
                                >
                                    Publicar primera listing →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                        <Tag className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
                        <h3 className="text-lg font-bold mb-2">Vendé más</h3>
                        <p className="text-emerald-100 text-sm mb-6">Publicá tus productos y llegá a más compradores en Moovy.</p>
                        <Link
                            href="/vendedor/listings"
                            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition"
                        >
                            Ver Mis Listings &rarr;
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                            Accesos Rápidos
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <Link href="/vendedor/pedidos" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Ver Mis Ventas</span>
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                            </Link>
                            <Link href="/vendedor/ganancias" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Ganancias y Pagos</span>
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                            </Link>
                            <Link href="/vendedor/configuracion" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Configuración</span>
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
