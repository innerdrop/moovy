import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/delivery";
import Link from "next/link";
import {
    Search,
    Filter,
    MoreHorizontal,
    ChevronDown,
    ShoppingBag
} from "lucide-react";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge"; // Will create this reusable
import OrderFilters from "@/components/admin/OrderFilters"; // Will create this

// Reusing badge logic to avoid duplication, or extracting to component
// I'll extract to component in next step. For now inline or local helper.

export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: { status?: string; page?: string; q?: string };
}) {
    const status = searchParams.status;
    const q = searchParams.q;
    const page = Number(searchParams.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status && status !== "ALL") {
        where.status = status;
    }
    if (q) {
        where.OR = [
            { orderNumber: { contains: q.toUpperCase() } },
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } }
        ];
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip,
        }),
        prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pedidos</h1>
                    <p className="text-slate-500">Gestioná y actualizá el estado de las órdenes.</p>
                </div>
                {/* <Link href="/admin/orders/new" className="btn-primary">Nueva Orden</Link> */}
            </div>

            {/* Filters & Search */}
            <OrderFilters currentStatus={status || "ALL"} currentSearch={q || ""} />

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                            <th className="px-6 py-4">Orden</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
                                        <p className="font-medium">No se encontraron pedidos</p>
                                        <p className="text-sm">Intenta cambiar los filtros o la búsqueda</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900 font-mono">
                                            {order.orderNumber}
                                        </div>
                                        {/* <div className="text-xs text-slate-400">ID: {order.id.slice(0,8)}...</div> */}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">
                                            {order.user?.name || "Cliente Eliminado"}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {order.user?.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(order.createdAt).toLocaleDateString("es-AR", {
                                            day: "2-digit",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <OrderStatusBadge status={order.status} />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {formatPrice(order.total)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="text-sm font-medium text-slate-500 hover:text-[#e60012] transition-colors"
                                        >
                                            Ver Detalle
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Simple) */}
            <div className="flex items-center justify-between text-sm text-slate-500">
                <p>
                    Mostrando {orders.length} de {total} resultados
                </p>
                <div className="flex gap-2">
                    {page > 1 && (
                        <Link href={`?page=${page - 1}&status=${status || ""}`} className="btn-outline py-1 px-3">
                            Anterior
                        </Link>
                    )}
                    {page < totalPages && (
                        <Link href={`?page=${page + 1}&status=${status || ""}`} className="btn-outline py-1 px-3">
                            Siguiente
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
