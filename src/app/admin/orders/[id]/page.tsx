import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/delivery";
import Link from "next/link";
import {
    ChevronLeft,
    MapPin,
    Phone,
    Mail,
    User,
    CreditCard
} from "lucide-react";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import OrderActions from "@/components/admin/OrderActions";
import { notFound } from "next/navigation";

export default async function AdminOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            items: true,
            address: true,
            user: { select: { name: true, email: true, phone: true } },
        },
    });

    if (!order) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header / Back */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/orders"
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900 font-mono">
                            {order.orderNumber}
                        </h1>
                        <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-slate-500 text-sm">
                        Creado el {new Date(order.createdAt).toLocaleString("es-AR")}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (Items & Totals) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-800">
                            Detalle del Pedido
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Producto</th>
                                    <th className="px-6 py-3 text-center">Cant</th>
                                    <th className="px-6 py-3 text-right">Precio</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900">{item.name}</p>
                                            {item.variantName && (
                                                <p className="text-xs text-slate-500">{item.variantName}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            {formatPrice(item.price)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {formatPrice(item.price * item.quantity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="bg-slate-50 px-6 py-4 space-y-2 border-t border-slate-200">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            {order.deliveryFee > 0 && (
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Envío</span>
                                    <span>{formatPrice(order.deliveryFee)}</span>
                                </div>
                            )}
                            {order.discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Descuento</span>
                                    <span>-{formatPrice(order.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200 mt-2">
                                <span>Total</span>
                                <span>{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Delivery Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Customer */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-slate-400" />
                                Cliente
                            </h3>
                            <div className="space-y-3">
                                <p className="font-medium text-slate-900">{order.user?.name || "Eliminado"}</p>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Mail className="w-4 h-4" />
                                    <a href={`mailto:${order.user?.email}`} className="hover:text-blue-600">
                                        {order.user?.email}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Phone className="w-4 h-4" />
                                    <a href={`tel:${order.user?.phone}`} className="hover:text-blue-600">
                                        {order.user?.phone || "-"}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-slate-400" />
                                Entrega
                            </h3>
                            <div className="space-y-3 text-sm">
                                <p className="text-slate-700">
                                    <span className="font-medium text-slate-900 block">Dirección:</span>
                                    {order.address?.street} {order.address?.number}
                                    {order.address?.apartment && `, Dpto ${order.address?.apartment}`}
                                    <br />
                                    {order.address?.city}, {order.address?.province}
                                </p>
                                {order.deliveryNotes && (
                                    <div className="bg-yellow-50 p-3 rounded-lg text-yellow-800 border border-yellow-100">
                                        <span className="font-medium block text-xs uppercase mb-1">Nota:</span>
                                        {order.deliveryNotes}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Actions) */}
                <div className="space-y-6">
                    <OrderActions orderId={order.id} currentStatus={order.status} />

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-slate-400" />
                            Pago
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Método</span>
                                <span className="font-medium capitalize">{order.paymentMethod === "mercadopago" ? "Mercado Pago" : "Efectivo"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Estado</span>
                                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                    }`}>
                                    {order.paymentStatus === "PAID" ? "Pagado" : "Pendiente"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
