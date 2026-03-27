"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Megaphone, CheckCircle2, Clock, XCircle, AlertCircle,
    Loader2, Play, ThumbsUp, ThumbsDown, Ban, Phone,
    Store, Calendar, DollarSign, Filter,
} from "lucide-react";

interface Merchant {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    isPremium: boolean;
    premiumTier: string | null;
    premiumUntil: string | null;
    phone: string | null;
    email: string | null;
    whatsappNumber: string | null;
}

interface AdPlacement {
    id: string;
    merchantId: string;
    type: string;
    status: string;
    amount: number;
    originalAmount: number | null;
    startsAt: string | null;
    endsAt: string | null;
    notes: string | null;
    adminNotes: string | null;
    rejectionReason: string | null;
    paymentStatus: string;
    paymentMethod: string | null;
    createdAt: string;
    approvedAt: string | null;
    activatedAt: string | null;
    merchant: Merchant;
}

const TYPE_LABELS: Record<string, string> = {
    DESTACADO_PLATINO: "Platino",
    DESTACADO_DESTACADO: "Destacado",
    DESTACADO_PREMIUM: "Premium",
    HERO_BANNER: "Hero Banner",
    BANNER_PROMO: "Banner Promo",
    PRODUCTO: "Producto",
};

const TYPE_COLORS: Record<string, string> = {
    DESTACADO_PLATINO: "bg-amber-100 text-amber-800",
    DESTACADO_DESTACADO: "bg-orange-100 text-orange-800",
    DESTACADO_PREMIUM: "bg-blue-100 text-blue-800",
    HERO_BANNER: "bg-red-100 text-red-800",
    BANNER_PROMO: "bg-pink-100 text-pink-800",
    PRODUCTO: "bg-violet-100 text-violet-800",
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    PENDING: { label: "Pendiente", icon: Clock, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    APPROVED: { label: "Aprobada", icon: ThumbsUp, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    ACTIVE: { label: "Activo", icon: CheckCircle2, color: "text-green-700", bg: "bg-green-50 border-green-200" },
    EXPIRED: { label: "Expirado", icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
    CANCELLED: { label: "Cancelado", icon: Ban, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
    REJECTED: { label: "Rechazado", icon: XCircle, color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const FILTER_OPTIONS = ["ALL", "PENDING", "APPROVED", "ACTIVE", "EXPIRED", "CANCELLED", "REJECTED"] as const;

function formatPrice(amount: number): string {
    return `$${amount.toLocaleString("es-AR")}`;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function daysRemaining(endsAt: string): number {
    return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function SolicitudesAdsPage() {
    const [placements, setPlacements] = useState<AdPlacement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("ALL");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [durationDays, setDurationDays] = useState<number>(30);

    const fetchData = useCallback(async () => {
        try {
            const url = filter === "ALL"
                ? "/api/admin/ad-placements"
                : `/api/admin/ad-placements?status=${filter}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPlacements(data.placements);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async (id: string, action: string, extra?: Record<string, any>) => {
        setActionLoading(`${id}-${action}`);
        setMessage(null);

        try {
            const res = await fetch(`/api/admin/ad-placements/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, durationDays, ...extra }),
            });

            const result = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: result.message || "Acción completada" });
                fetchData();
            } else {
                setMessage({ type: "error", text: result.error || "Error" });
            }
        } catch {
            setMessage({ type: "error", text: "Error de conexión" });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    // Stats
    const pendingCount = placements.filter((p) => p.status === "PENDING").length;
    const activeCount = placements.filter((p) => p.status === "ACTIVE").length;
    const totalRevenue = placements.filter((p) => p.status === "ACTIVE").reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 italic">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e60012] to-[#cc000f] flex items-center justify-center shadow-lg not-italic">
                            <Megaphone className="w-7 h-7 text-white" />
                        </div>
                        Solicitudes de Publicidad
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1">
                        Gestión de espacios publicitarios
                    </p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-2xl text-sm font-medium ${
                    message.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                    {message.text}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Pendientes</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{pendingCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100">
                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Activos</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{activeCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Revenue Ads</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{formatPrice(totalRevenue)}<span className="text-sm font-medium text-gray-400">/mes</span></p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-gray-400" />
                {FILTER_OPTIONS.map((f) => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setLoading(true); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            filter === f
                                ? "bg-[#e60012] text-white"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        {f === "ALL" ? "Todos" : STATUS_CONFIG[f]?.label || f}
                    </button>
                ))}
            </div>

            {/* Duration selector for activation */}
            <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-slate-100">
                <Calendar className="w-4 h-4 text-gray-400" />
                <label className="text-xs font-bold text-gray-500">Duración al activar:</label>
                <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value))}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-900"
                >
                    <option value={7}>7 días</option>
                    <option value={15}>15 días</option>
                    <option value={30}>30 días (1 mes)</option>
                    <option value={60}>60 días (2 meses)</option>
                    <option value={90}>90 días (3 meses)</option>
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                </div>
            )}

            {/* Empty */}
            {!loading && placements.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-gray-600">No hay solicitudes</p>
                    <p className="text-sm mt-1">Las solicitudes aparecen cuando un comercio pide un espacio publicitario</p>
                </div>
            )}

            {/* Placements list */}
            {!loading && placements.length > 0 && (
                <div className="space-y-4">
                    {placements.map((p) => {
                        const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                        const StatusIcon = statusCfg.icon;
                        const typeColor = TYPE_COLORS[p.type] || "bg-gray-100 text-gray-800";
                        const isExpiringSoon = p.endsAt && daysRemaining(p.endsAt) <= 7;

                        return (
                            <div key={p.id} className={`border rounded-2xl p-5 ${statusCfg.bg}`}>
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        {/* Merchant avatar */}
                                        <div className="w-11 h-11 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {p.merchant.image ? (
                                                <img src={p.merchant.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Store className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{p.merchant.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeColor}`}>
                                                    {TYPE_LABELS[p.type] || p.type}
                                                </span>
                                                <span className="text-xs text-gray-400">{formatDate(p.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusCfg.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {statusCfg.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Info row */}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mb-3">
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        {formatPrice(p.amount)}/mes
                                        {p.originalAmount && (
                                            <span className="line-through text-gray-400 ml-1">{formatPrice(p.originalAmount)}</span>
                                        )}
                                    </span>
                                    {p.merchant.whatsappNumber && (
                                        <a
                                            href={`https://wa.me/${p.merchant.whatsappNumber.replace(/\D/g, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-green-600 hover:underline"
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                            WhatsApp
                                        </a>
                                    )}
                                    {p.merchant.phone && !p.merchant.whatsappNumber && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            {p.merchant.phone}
                                        </span>
                                    )}
                                    {p.startsAt && p.endsAt && (
                                        <span className={isExpiringSoon ? "text-red-600 font-bold" : ""}>
                                            {formatDate(p.startsAt)} → {formatDate(p.endsAt)}
                                            {isExpiringSoon && ` (${daysRemaining(p.endsAt)}d)`}
                                        </span>
                                    )}
                                    {p.paymentMethod && (
                                        <span className="text-gray-400">Pago: {p.paymentMethod}</span>
                                    )}
                                </div>

                                {/* Notes */}
                                {p.notes && (
                                    <p className="text-xs text-gray-500 bg-white/50 rounded-xl p-3 mb-3">
                                        <span className="font-bold">Nota del comercio:</span> {p.notes}
                                    </p>
                                )}
                                {p.rejectionReason && (
                                    <p className="text-xs text-red-600 bg-red-50 rounded-xl p-3 mb-3">
                                        <span className="font-bold">Motivo rechazo:</span> {p.rejectionReason}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* PENDING → Aprobar / Activar directamente / Rechazar */}
                                    {p.status === "PENDING" && (
                                        <>
                                            <button
                                                onClick={() => handleAction(p.id, "approve")}
                                                disabled={actionLoading === `${p.id}-approve`}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                {actionLoading === `${p.id}-approve` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => handleAction(p.id, "activate", { paymentMethod: "transfer" })}
                                                disabled={actionLoading === `${p.id}-activate`}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                                            >
                                                {actionLoading === `${p.id}-activate` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                                Activar ({durationDays}d)
                                            </button>
                                            <button
                                                onClick={() => handleAction(p.id, "reject", { rejectionReason: "Solicitud rechazada" })}
                                                disabled={actionLoading === `${p.id}-reject`}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 text-xs font-bold rounded-xl border border-red-200 hover:bg-red-50 transition disabled:opacity-50"
                                            >
                                                {actionLoading === `${p.id}-reject` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                                                Rechazar
                                            </button>
                                        </>
                                    )}

                                    {/* APPROVED → Activar / Cancelar */}
                                    {p.status === "APPROVED" && (
                                        <>
                                            <button
                                                onClick={() => handleAction(p.id, "activate", { paymentMethod: "transfer" })}
                                                disabled={actionLoading === `${p.id}-activate`}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                                            >
                                                {actionLoading === `${p.id}-activate` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                                Activar ({durationDays}d)
                                            </button>
                                            <button
                                                onClick={() => handleAction(p.id, "cancel")}
                                                disabled={actionLoading === `${p.id}-cancel`}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
                                            >
                                                <Ban className="w-3.5 h-3.5" />
                                                Cancelar
                                            </button>
                                        </>
                                    )}

                                    {/* ACTIVE → Cancelar */}
                                    {p.status === "ACTIVE" && (
                                        <button
                                            onClick={() => handleAction(p.id, "cancel")}
                                            disabled={actionLoading === `${p.id}-cancel`}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 text-xs font-bold rounded-xl border border-red-200 hover:bg-red-50 transition disabled:opacity-50"
                                        >
                            