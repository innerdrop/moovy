"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Megaphone, Star, Crown, Gem, Image as ImageIcon, Tag,
    Loader2, CheckCircle2, Clock, XCircle, AlertCircle,
    Sparkles, ArrowRight, BadgePercent,
} from "lucide-react";

interface AdPlacement {
    id: string;
    type: string;
    status: string;
    amount: number;
    originalAmount: number | null;
    startsAt: string | null;
    endsAt: string | null;
    notes: string | null;
    rejectionReason: string | null;
    paymentStatus: string;
    createdAt: string;
}

interface AdTypeConfig {
    label: string;
    priceField: string;
    premiumTier?: string;
}

const TYPE_ICONS: Record<string, any> = {
    DESTACADO_PLATINO: Crown,
    DESTACADO_DESTACADO: Star,
    DESTACADO_PREMIUM: Gem,
    HERO_BANNER: ImageIcon,
    BANNER_PROMO: Megaphone,
    PRODUCTO: Tag,
};

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    DESTACADO_PLATINO: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-800" },
    DESTACADO_DESTACADO: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-800" },
    DESTACADO_PREMIUM: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-800" },
    HERO_BANNER: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800" },
    BANNER_PROMO: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", badge: "bg-pink-100 text-pink-800" },
    PRODUCTO: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-800" },
};

const TYPE_BENEFITS: Record<string, string[]> = {
    DESTACADO_PLATINO: [
        "Posición #1 garantizada en la home",
        "Badge premium visible para compradores",
        "Push notification a usuarios cercanos",
        "Aparecés primero en búsquedas",
    ],
    DESTACADO_DESTACADO: [
        "Top 3 en la sección destacados",
        "Aparecés en categorías destacadas",
        "Badge de comercio destacado",
    ],
    DESTACADO_PREMIUM: [
        "Badge premium en tu perfil",
        "Posición preferencial en la home",
        "Mayor visibilidad en búsquedas",
    ],
    HERO_BANNER: [
        "Banner full-width arriba de todo",
        "Máxima visibilidad (above the fold)",
        "Diseño personalizado con tu marca",
        "Máximo 3 comercios simultáneos",
    ],
    BANNER_PROMO: [
        "Banner horizontal con botón de acción",
        "Visible para todos los usuarios",
        "Ideal para promociones temporales",
    ],
    PRODUCTO: [
        "Producto individual destacado en la home",
        "Hasta 12 productos simultáneos",
        "Ideal para lanzamientos o liquidaciones",
    ],
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    PENDING: { label: "Pendiente", icon: Clock, color: "text-amber-600 bg-amber-50" },
    APPROVED: { label: "Aprobada", icon: CheckCircle2, color: "text-blue-600 bg-blue-50" },
    ACTIVE: { label: "Activo", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    EXPIRED: { label: "Expirado", icon: AlertCircle, color: "text-gray-500 bg-gray-50" },
    CANCELLED: { label: "Cancelado", icon: XCircle, color: "text-gray-500 bg-gray-50" },
    REJECTED: { label: "Rechazado", icon: XCircle, color: "text-red-600 bg-red-50" },
};

function formatPrice(amount: number): string {
    return `$${amount.toLocaleString("es-AR")}`;
}

function daysRemaining(endsAt: string): number {
    return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function PublicidadPage() {
    const [data, setData] = useState<{
        placements: AdPlacement[];
        settings: any;
        adTypes: Record<string, AdTypeConfig>;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/merchant/ad-placements");
            if (res.ok) {
                setData(await res.json());
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRequest = async (type: string) => {
        setRequesting(type);
        setMessage(null);

        try {
            const res = await fetch("/api/merchant/ad-placements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type }),
            });

            const result = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: result.message || "Solicitud enviada" });
                fetchData(); // Refresh
            } else {
                setMessage({ type: "error", text: result.error || "Error al enviar solicitud" });
            }
        } catch {
            setMessage({ type: "error", text: "Error de conexión" });
        } finally {
            setRequesting(null);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No se pudo cargar la información</p>
            </div>
        );
    }

    const { placements, settings, adTypes } = data;
    const discountPercent = settings?.adLaunchDiscountPercent ?? 0;
    const activePlacements = placements.filter((p) => p.status === "ACTIVE");
    const pendingPlacements = placements.filter((p) => ["PENDING", "APPROVED"].includes(p.status));
    const pastPlacements = placements.filter((p) => ["EXPIRED", "CANCELLED", "REJECTED"].includes(p.status));

    // Check which types already have pending/active
    const occupiedTypes = new Set(
        placements
            .filter((p) => ["PENDING", "APPROVED", "ACTIVE"].includes(p.status))
            .map((p) => p.type)
    );

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e60012] to-[#cc000f] flex items-center justify-center shadow-lg">
                        <Megaphone className="w-7 h-7 text-white" />
                    </div>
                    Publicidad
                </h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1">
                    Espacios publicitarios para tu comercio
                </p>
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

            {/* Active placements */}
            {activePlacements.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-black text-gray-900">Tus anuncios activos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activePlacements.map((p) => {
                            const colors = TYPE_COLORS[p.type] || TYPE_COLORS.PRODUCTO;
                            const Icon = TYPE_ICONS[p.type] || Tag;
                            const days = p.endsAt ? daysRemaining(p.endsAt) : 0;
                            const isExpiringSoon = days <= 7;

                            return (
                                <div key={p.id} className={`${colors.bg} border ${colors.border} rounded-2xl p-5`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Icon className={`w-5 h-5 ${colors.text}`} />
                                        <span className="font-bold text-sm text-gray-900">
                                            {adTypes[p.type]?.label || p.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500">Pagado: {formatPrice(p.amount)}/mes</p>
                                            {p.endsAt && (
                                                <p className={`text-xs font-bold mt-1 ${isExpiringSoon ? "text-red-600" : "text-gray-600"}`}>
                                                    {isExpiringSoon ? `⚠️ Vence en ${days} día(s)` : `${days} días restantes`}
                                                </p>
                                            )}
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                            Activo
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Pending placements */}
            {pendingPlacements.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-black text-gray-900">Solicitudes en proceso</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingPlacements.map((p) => {
                            const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                            const StatusIcon = statusCfg.icon;
                            return (
                                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-sm text-gray-900">
                                            {adTypes[p.type]?.label || p.type}
                                        </span>
                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusCfg.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {statusCfg.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {p.status === "APPROVED"
                                            ? "Aprobada — coordinando pago con el equipo MOOVY"
                                            : "Nuestro equipo está revisando tu solicitud"
                                        }
                                    </p>
                                    <p className="text-xs font-bold text-gray-700 mt-2">
                                        Monto: {formatPrice(p.amount)}/mes
                                        {p.originalAmount && (
                                            <span className="line-through text-gray-400 ml-2">{formatPrice(p.originalAmount)}</span>
                                        )}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Discount banner */}
            {discountPercent > 0 && (
                <div className="bg-gradient-to-r from-[#e60012] to-[#ff4d5e] rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <BadgePercent className="w-6 h-6" />
                        <h3 className="font-black text-lg">Descuento de lanzamiento: {discountPercent}% OFF</h3>
                    </div>
                    <p className="text-white/80 text-sm">
                        Por ser de los primeros comercios en MOOVY, todos los espacios publicitarios tienen un {discountPercent}% de descuento durante los primeros 3 meses.
                    </p>
                </div>
            )}

            {/* Ad catalog */}
            <div>
                <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Espacios disponibles
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.entries(adTypes).map(([type, config]) => {
                        const colors = TYPE_COLORS[type] || TYPE_COLORS.PRODUCTO;
                        const Icon = TYPE_ICONS[type] || Tag;
                        const originalPrice = settings?.[config.priceField] ?? 0;
                        const finalPrice = discountPercent > 0
                            ? Math.round(originalPrice * (1 - discountPercent / 100))
                            : originalPrice;
                        const benefits = TYPE_BENEFITS[type] || [];
                        const isOccupied = occupiedTypes.has(type);
                        const isRequesting = requesting === type;

                        return (
                            <div key={type} className={`${colors.bg} border ${colors.border} rounded-2xl p-5 flex flex-col`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl ${colors.badge} flex items-center justify-center`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-900">{config.label.split("—")[0].trim()}</h3>
                                        <p className="text-[10px] text-gray-500">{config.label.split("—")[1]?.trim()}</p>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-3">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-gray-900">
                                            {formatPrice(finalPrice)}
                                        </span>
                                        <span className="text-xs text-gray-400">/mes</span>
                                    </div>
                                    {discountPercent > 0 && (
                                        <span className="text-xs text-gray-400 line-through">
                                            {formatPrice(originalPrice)}
                                        </span>
                                    )}
                                </div>

                                {/* Benefits */}
                                <ul className="space-y-1.5 mb-4 flex-1">
                                    {benefits.map((b, i) => (
                                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                            <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${colors.text}`} />
                                            {b}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {isOccupied ? (
                                    <div className="text-center py-2.5 text-xs font-bold text-gray-400 bg-gray-100 rounded-xl">
                                        Ya solicitado
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleRequest(type)}
                                        disabled={isRequesting}
                                        className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-1.5 ${
                                            isRequesting
                                                ? "bg-gray-300 cursor-not-allowed"
                                                : "bg-[#e60012] hover:bg-[#cc000f] active:scale-[0.98]"
                                        }`}
                                    >
                                        {isRequesting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                Solicitar
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* How it works */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-black text-gray-900 mb-4">¿Cómo funciona?</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { step: "1", title: "Elegí tu espacio", desc: "Seleccioná el tipo de publicidad que mejor se adapte a tu comercio" },
                        { step: "2", title: "Enviá la solicitud", desc: "Nuestro equipo la revisa en menos de 24 horas" },
                        { step: "3", title: "Coordinamos el pago", desc: "Te contactamos por WhatsApp para coordinar el pago" },
                        { step: "4", title: "¡Tu anuncio está activo!", desc: "Lo activamos y podés ver el estado desde acá" },
                    ].map((s) => (
                        <div key={s.step} className="text-center">
                            <div className="w-8 h-8 rounded-full bg-[#e60012] text-white font-black text-sm flex items-center justify-center mx-auto mb-2">
                                {s.step}
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 mb-1">{s.title}</h4>
                            <p className="text-[11px] text-gray-500">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Past placements */}
            {pastPlacements.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Historial</h2>
                    <div className="space-y-2">
                        {pastPlacements.map((p) => {
                            const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.EXPIRED;
                            return (
                                <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <span className="font-medium text-sm text-gray-700">
                                            {adTypes[p.type]?.label?.split("—")[0]?.trim() || p.type}
                                        </span>
                                        <p className="text-xs text-gray-400">
                                            {new Date(p.createdAt).toLocaleDateString("es-AR")}
                                            {p.rejectionReason && ` — ${p.rejectionReason}`}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                                        {statusCfg.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}