"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
    ChevronLeft, Gift, Save, Loader2, AlertCircle, CheckCircle,
    User, Package, MapPin, Phone, Mail, Calendar, ShoppingBag
} from "lucide-react";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";
import { formatPrice } from "@/lib/delivery";

interface UserData {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    pointsBalance: number;
    createdAt: string;
}

interface OrderSummary {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    merchant: { name: string } | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
    PREPARING: { label: "Preparando", color: "bg-red-100 text-red-700" },
    READY: { label: "Listo", color: "bg-indigo-100 text-indigo-700" },
    IN_DELIVERY: { label: "En camino", color: "bg-orange-100 text-orange-700" },
    DELIVERED: { label: "Entregado", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const userId = unwrappedParams.id;

    const [user, setUser] = useState<UserData | null>(null);
    const [orders, setOrders] = useState<OrderSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentReason, setAdjustmentReason] = useState("");
    const [adjustmentType, setAdjustmentType] = useState<"ADD" | "SUBTRACT">("ADD");
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchUser();
    }, [userId]);

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                const foundUser = data.find((u: UserData) => u.id === userId);
                if (foundUser) {
                    setUser(foundUser);
                    fetchOrders(foundUser.email);
                } else {
                    setMessage({ type: "error", text: "Usuario no encontrado" });
                }
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async (email: string) => {
        try {
            const res = await fetch(`/api/admin/orders?search=${encodeURIComponent(email)}&limit=20`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        setProcessing(true);

        const amount = parseInt(adjustmentAmount);
        if (isNaN(amount) || amount <= 0) {
            setMessage({ type: "error", text: "Ingresá un monto válido." });
            setProcessing(false);
            return;
        }

        const finalAmount = adjustmentType === "ADD" ? amount : -amount;

        const ok = await confirm({
            title: adjustmentType === "ADD" ? "Sumar puntos" : "Restar puntos",
            message: `¿${adjustmentType === "ADD" ? "Sumar" : "Restar"} ${amount} puntos a este usuario?`,
            confirmLabel: "Confirmar",
            variant: adjustmentType === "SUBTRACT" ? "danger" : "default",
        });
        if (!ok) { setProcessing(false); return; }

        try {
            const res = await fetch(`/api/admin/users/${userId}/points`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: finalAmount,
                    description: adjustmentReason || "Ajuste manual de administrador",
                    type: "ADJUSTMENT",
                }),
            });

            if (res.ok) {
                toast.success("Puntos ajustados correctamente");
                setAdjustmentAmount("");
                setAdjustmentReason("");
                fetchUser();
            } else {
                toast.error("Error al ajustar puntos");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Usuario no encontrado.</p>
                <Link href="/ops/clientes" className="text-[#e60012] hover:underline mt-2 inline-block">Volver al listado</Link>
            </div>
        );
    }

    const totalSpent = orders.filter(o => o.status === "DELIVERED").reduce((acc, o) => acc + o.total, 0);
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === "DELIVERED").length;

    return (
        <div className="space-y-6">
            <Link href="/ops/clientes" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition">
                <ChevronLeft className="w-4 h-4 mr-1" /> Volver a Clientes
            </Link>

            {/* User Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-[#e60012] font-black text-2xl border border-red-100">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{user.name || "Sin nombre"}</h1>
                            <p className="text-slate-500 flex items-center gap-2"><Mail className="w-4 h-4" /> {user.email}</p>
                            {user.phone && <p className="text-slate-500 flex items-center gap-2"><Phone className="w-4 h-4" /> {user.phone}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Puntos</p>
                            <p className="text-2xl font-bold text-[#e60012] flex items-center gap-1"><Gift className="w-5 h-5" /> {user.pointsBalance}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Miembro desde</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString("es-AR")}</p>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pedidos</p>
                    <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entregados</p>
                    <p className="text-2xl font-bold text-green-600">{deliveredOrders}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Gastado</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(totalSpent)}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Orders History */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-[#e60012]" /> Historial de Pedidos</h2>
                    </div>
                    {ordersLoading ? (
                        <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></div>
                    ) : orders.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {orders.map((order) => {
                                const st = statusLabels[order.status] || { label: order.status, color: "bg-slate-100 text-slate-600" };
                                return (
                                    <Link key={order.id} href={`/ops/pedidos/${order.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition">
                                        <div>
                                            <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                                            <p className="text-xs text-slate-400">{order.merchant?.name || "—"} • {new Date(order.createdAt).toLocaleDateString("es-AR")}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${st.color}`}>{st.label}</span>
                                            <span className="font-bold text-gray-900">{formatPrice(order.total)}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400">
                            <Package className="w-12 h-12 mx-auto mb-2 text-slate-200" />
                            <p>Este cliente aún no tiene pedidos</p>
                        </div>
                    )}
                </div>

                {/* Points Adjustment */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Gift className="w-5 h-5 text-[#e60012]" /> Ajustar Puntos</h2>
                    <form onSubmit={handleAdjustment} className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                            <button type="button" onClick={() => setAdjustmentType("ADD")} className={`py-2 text-sm font-medium rounded-md transition ${adjustmentType === "ADD" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Sumar (+)</button>
                            <button type="button" onClick={() => setAdjustmentType("SUBTRACT")} className={`py-2 text-sm font-medium rounded-md transition ${adjustmentType === "SUBTRACT" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Restar (-)</button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                            <input type="number" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} placeholder="0" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" min="1" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                            <input type="text" value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} placeholder="Ej: Bonificación..." className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                        <button type="submit" disabled={processing} className={`w-full py-2.5 rounded-lg font-bold text-white transition flex items-center justify-center gap-2 ${adjustmentType === "ADD" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {adjustmentType === "ADD" ? "Sumar Puntos" : "Restar Puntos"}</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
