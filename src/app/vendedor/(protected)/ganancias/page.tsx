import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    AlertCircle,
    ShoppingCart,
} from "lucide-react";

export default async function VendedorGananciasPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/vendedor");
    }

    const seller = await prisma.sellerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!seller) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Error de Cuenta</h2>
                <p className="text-gray-500">No tenés un perfil de vendedor.</p>
            </div>
        );
    }

    // Current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [currentMonthEarnings, lastMonthEarnings, totalDelivered, recentDelivered] =
        await Promise.all([
            // Current month earnings
            prisma.subOrder.aggregate({
                where: {
                    sellerId: seller.id,
                    status: "DELIVERED",
                    createdAt: { gte: startOfMonth },
                },
                _sum: { sellerPayout: true },
                _count: true,
            }),
            // Last month earnings
            prisma.subOrder.aggregate({
                where: {
                    sellerId: seller.id,
                    status: "DELIVERED",
                    createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
                },
                _sum: { sellerPayout: true },
                _count: true,
            }),
            // Total all-time delivered
            prisma.subOrder.aggregate({
                where: {
                    sellerId: seller.id,
                    status: "DELIVERED",
                },
                _sum: { sellerPayout: true },
                _count: true,
            }),
            // Last 10 delivered orders
            prisma.subOrder.findMany({
                where: {
                    sellerId: seller.id,
                    status: "DELIVERED",
                },
                take: 10,
                orderBy: { createdAt: "desc" },
                include: {
                    order: {
                        select: { orderNumber: true, createdAt: true },
                    },
                },
            }),
        ]);

    const currentEarnings = currentMonthEarnings._sum.sellerPayout || 0;
    const lastEarnings = lastMonthEarnings._sum.sellerPayout || 0;
    const allTimeEarnings = totalDelivered._sum.sellerPayout || 0;
    const earningsDiff = currentEarnings - lastEarnings;

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                    Ganancias
                </h1>
                <p className="text-gray-500">Resumen de tus ingresos por ventas</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {monthNames[now.getMonth()]}
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                        ${currentEarnings.toLocaleString("es-AR")}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                        {earningsDiff >= 0 ? (
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-purple-600" />
                        )}
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        vs Mes Anterior
                    </p>
                    <p className={`text-xl font-bold ${earningsDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {earningsDiff >= 0 ? "+" : ""}${earningsDiff.toLocaleString("es-AR")}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Ventas Totales
                    </p>
                    <p className="text-xl font-bold text-gray-900">{totalDelivered._count}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-amber-200 transition-colors">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                        <CreditCard className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Total Histórico
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                        ${allTimeEarnings.toLocaleString("es-AR")}
                    </p>
                </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    Datos Bancarios
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Alias
                        </p>
                        <p className="font-bold text-gray-900">
                            {seller.bankAlias || "No configurado"}
                        </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            CBU
                        </p>
                        <p className="font-bold text-gray-900 font-mono text-sm">
                            {seller.bankCbu || "No configurado"}
                        </p>
                    </div>
                </div>
                {(!seller.bankAlias && !seller.bankCbu) && (
                    <p className="text-sm text-amber-600 mt-3">
                        ⚠️ Configurá tus datos bancarios en{" "}
                        <a href="/vendedor/configuracion" className="underline font-semibold">
                            Configuración
                        </a>{" "}
                        para recibir pagos.
                    </p>
                )}
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Últimas Ventas Completadas
                    </h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {recentDelivered.length > 0 ? (
                        recentDelivered.map((so) => (
                            <div
                                key={so.id}
                                className="p-4 flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-bold text-sm text-gray-900">
                                        #{so.order.orderNumber}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(so.order.createdAt).toLocaleDateString("es-AR")}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-600">
                                        +${(so.sellerPayout || 0).toLocaleString("es-AR")}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        Total: ${so.total.toLocaleString("es-AR")}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400">No hay ventas completadas aún.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
