// Comercios Portal — Dashboard con DOS MODOS (feat/panel-inmediato-comercio):
//
//   · MODO ARMADO (no aprobado o requisitos incompletos): la única pregunta del
//     comercio nuevo es "¿y ahora qué hago?" — la pantalla responde con UNA
//     tarjeta-guía de pasos (producto → logo → horarios → dirección → docs) con
//     progreso y un solo CTA. Sin métricas en cero, sin banners apilados.
//   · MODO OPERACIÓN (aprobado + requisitos completos): métricas, pedidos y
//     accesos — el dashboard de trabajo de siempre.
//
// Regla de una sola advertencia por pantalla: el estado "tu tienda no es
// pública" vive DENTRO de la tarjeta-guía, no en banners paralelos.
import { Package, ShoppingCart, Plus, Settings, Clock, AlertCircle, ArrowRight, Star, Gift, Check, ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { formatTime } from "@/lib/timezone";
import { prisma } from "@/lib/prisma";
import { checkMerchantSchedule } from "@/lib/merchant-schedule";
import {
    isInFirstMonthFree,
    getFirstMonthFreeEndDate,
    getFirstMonthFreeDaysRemaining,
    firstMonthFreeBaseDate,
} from "@/lib/merchant-loyalty";
import KPIDashboard from "./KPIDashboard";
import StorePauseCard from "@/components/comercios/StorePauseCard";
import { computeMerchantSetup } from "@/lib/merchant-setup";

const RED = "#e60012";

export default async function ComerciosDashboardPage() {
    const session = await auth();
    const userName = session?.user?.name || "Comerciante";
    const firstName = userName.trim().split(/\s+/)[0];

    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: session?.user?.id },
    });

    if (!merchant) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Error de Cuenta</h2>
                <p className="text-gray-500">No tienes un comercio asociado a tu cuenta.</p>
            </div>
        );
    }

    const ORDER_STATUS_ES: Record<string, string> = {
        PENDING: "Pendiente",
        CONFIRMED: "Confirmado",
        PREPARING: "Preparando",
        READY: "Listo",
        IN_DELIVERY: "En camino",
        DELIVERED: "Entregado",
        CANCELLED: "Cancelado",
        SEARCHING_DRIVER: "Buscando repartidor",
        SCHEDULED: "Programado",
        SCHEDULED_CONFIRMED: "Programado",
    };

    const [pendingOrdersCount, recentOrders] = await Promise.all([
        prisma.order.count({
            where: {
                merchantId: merchant.id,
                status: { in: ["PENDING", "CONFIRMED"] },
                deletedAt: null,
            },
        }),
        prisma.order.findMany({
            where: { merchantId: merchant.id, deletedAt: null },
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true } }
            }
        })
    ]);

    // Estado de armado — helper canónico compartido con la barra del layout
    const setup = await computeMerchantSetup(merchant);
    const { steps: setupSteps, doneCount, nextStep, setupMode, waitingApproval, canOpenStore, activeProducts } = setup;
    const progressPct = Math.round((doneCount / setup.total) * 100);

    // Chip de estado (ISSUE-038): Pendiente / Cerrada / Abierta
    const scheduleResult = checkMerchantSchedule({
        isOpen: merchant.isOpen,
        scheduleJson: merchant.scheduleJson,
    });

    type ChipState = "pending" | "closed" | "open";
    let chipState: ChipState;
    let chipLabel: string;
    let chipSubtitle: string | null = null;

    if (merchant.approvalStatus !== "APPROVED" || !canOpenStore) {
        chipState = "pending";
        chipLabel = "En preparación";
        chipSubtitle = null;
    } else if (!scheduleResult.isCurrentlyOpen) {
        chipState = "closed";
        chipLabel = "Cerrada";
        if (scheduleResult.isPaused) {
            chipSubtitle = "Pausada manualmente";
        } else if (scheduleResult.nextOpenTime && scheduleResult.nextOpenDay) {
            chipSubtitle = `Abre ${scheduleResult.nextOpenDay} ${scheduleResult.nextOpenTime}`;
        } else {
            chipSubtitle = "Fuera de horario";
        }
    } else {
        chipState = "open";
        chipLabel = "Abierta";
    }

    const chipStyles: Record<ChipState, { bg: string; text: string; dot: string; dotAnim: string }> = {
        pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", dotAnim: "" },
        closed: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", dotAnim: "" },
        open: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", dotAnim: "animate-pulse" },
    };
    const chip = chipStyles[chipState];

    // Mes 1 gratis (ISSUE-020 + feat/panel-inmediato-comercio): la ventana
    // arranca al APROBARSE (firstMonthFreeBaseDate) — sin aprobar, no corre.
    const hasCommissionOverride = merchant.commissionOverride !== null && merchant.commissionOverride !== undefined;
    const firstMonthBase = firstMonthFreeBaseDate(merchant);
    const firstMonthFreeActive = !hasCommissionOverride && !!firstMonthBase && isInFirstMonthFree(firstMonthBase);
    const firstMonthFreeDaysLeft = firstMonthFreeActive && firstMonthBase
        ? getFirstMonthFreeDaysRemaining(firstMonthBase)
        : 0;
    const firstMonthFreeEndLabel = firstMonthBase
        ? getFirstMonthFreeEndDate(firstMonthBase).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
        : "";

    // Línea compacta del mes gratis (compartida por ambos modos — informativa,
    // nunca compite con la acción principal)
    const firstMonthLine = firstMonthFreeActive ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <Gift className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">
                <b className="font-bold">Primer mes: 0% de comisión.</b> Te {firstMonthFreeDaysLeft === 1 ? "queda 1 día" : `quedan ${firstMonthFreeDaysLeft} días`} (hasta el {firstMonthFreeEndLabel}).
            </p>
        </div>
    ) : !hasCommissionOverride && merchant.approvalStatus !== "APPROVED" ? (
        // Todavía no aprobado: el trial NO corre mientras arma la tienda (justo)
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <Gift className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">
                <b className="font-bold">Tu primer mes con 0% de comisión</b> arranca recién cuando aprobemos tu tienda — armala tranquilo, no perdés días.
            </p>
        </div>
    ) : null;

    // ─────────────────────────────────────────────── MODO ARMADO ──────────
    if (setupMode) {
        return (
            <div className="mx-auto max-w-xl space-y-4 pt-2">
                {/* Saludo + estado */}
                <div className="px-1">
                    <p className="text-[15px] text-gray-500">Hola, {firstName} 👋</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h1 className="text-[26px] font-black leading-tight text-gray-900">{merchant.name}</h1>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${chip.bg} ${chip.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
                            {chipLabel}
                        </span>
                    </div>
                </div>

                {/* LA tarjeta: guía de armado con progreso. Única fuente del estado
                    "tu tienda no es pública" (nada de banners apilados). */}
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <div className="px-5 pb-4 pt-5 sm:px-6">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-[18px] font-black text-gray-900">
                                {waitingApproval ? "¡Todo listo de tu lado!" : "Prepará tu tienda"}
                            </h2>
                            <span className="text-[13px] font-bold text-gray-400">{doneCount} de {setupSteps.length}</span>
                        </div>
                        {/* Barra de progreso */}
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(progressPct, 4)}%`, backgroundColor: waitingApproval ? "#059669" : RED }} />
                        </div>
                        <p className="mt-3 text-[13.5px] leading-relaxed text-gray-500">
                            {waitingApproval
                                ? "El equipo de Moovy está revisando tus documentos: en las próximas 24-48 hs hábiles tu tienda queda habilitada. Te avisamos por email."
                                : "Tu tienda es privada mientras la armás: nadie la ve hasta que completes estos pasos y aprobemos tu documentación."}
                        </p>
                    </div>

                    {!waitingApproval && (
                        <div className="border-t border-gray-50">
                            {setupSteps.map((step) => {
                                const isNext = nextStep?.id === step.id;
                                return (
                                    <Link
                                        key={step.id}
                                        href={step.href}
                                        className={`flex items-center gap-3.5 px-5 py-3.5 transition sm:px-6 ${isNext ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-gray-50"} ${step.done ? "opacity-60" : ""}`}
                                    >
                                        <span
                                            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-black ${step.done ? "bg-emerald-500 text-white" : isNext ? "text-white" : "bg-gray-100 text-gray-400"}`}
                                            style={isNext ? { backgroundColor: RED } : undefined}
                                        >
                                            {step.done ? <Check className="h-4 w-4" strokeWidth={3} /> : setupSteps.indexOf(step) + 1}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={`block text-[15px] leading-tight ${step.done ? "font-semibold text-gray-500 line-through decoration-gray-300" : isNext ? "font-black text-gray-900" : "font-semibold text-gray-700"}`}>
                                                {step.label}
                                            </span>
                                            {!step.done && <span className="mt-0.5 block text-[12.5px] text-gray-400">{step.hint}</span>}
                                        </span>
                                        {isNext ? (
                                            <span className="flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-black text-white" style={{ backgroundColor: RED }}>
                                                Empezar
                                            </span>
                                        ) : (
                                            !step.done && <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {firstMonthLine}

                {/* Ayuda, discreta */}
                <p className="px-1 text-center text-[13px] text-gray-400">
                    ¿Trabado con algo? <Link href="/comercios/soporte" className="font-bold text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-700">Escribinos</Link> — somos de Ushuaia, respondemos rápido.
                </p>
            </div>
        );
    }

    // ────────────────────────────────────────────── MODO OPERACIÓN ────────
    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-[15px] text-gray-500">Hola, {firstName} 👋</p>
                    <h1 className="text-2xl font-black text-gray-900">{merchant.name}</h1>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${chip.bg} ${chip.text}`}
                        title={chipSubtitle || undefined}
                    >
                        <span className={`w-2 h-2 rounded-full ${chip.dot} ${chip.dotAnim}`} />
                        <span className="flex items-baseline gap-1.5">
                            <span>{chipLabel}</span>
                            {chipSubtitle && (
                                <span className="hidden sm:inline text-[11px] font-normal opacity-80">
                                    · {chipSubtitle}
                                </span>
                            )}
                        </span>
                    </div>
                    <Link
                        href="/comercios/productos/nuevo"
                        className="flex items-center gap-2 text-white px-4 py-2 rounded-xl hover:opacity-90 transition shadow-sm hover:shadow-md text-sm font-semibold"
                        style={{ backgroundColor: RED }}
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden xs:inline">Nuevo Producto</span>
                    </Link>
                </div>
            </div>

            {/* Pausa rápida (founder 07-26): acción de emergencia a mano, no
                escondida en Horarios. Solo modo operación (acá ya está APPROVED). */}
            <StorePauseCard initialIsOpen={merchant.isOpen} />

            {/* Pedidos pendientes: LA alerta accionable (única con derecho a gritar) */}
            {pendingOrdersCount > 0 && (
                <Link
                    href="/comercios/pedidos"
                    className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-2xl hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Clock className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="flex-1">
                        <span className="font-bold block">Acción Requerida</span>
                        <span className="text-sm opacity-90">Tienes {pendingOrdersCount} pedido{pendingOrdersCount > 1 ? 's' : ''} pendiente{pendingOrdersCount > 1 ? 's' : ''} para gestionar.</span>
                    </div>
                    <span className="text-amber-600 font-bold hidden sm:inline">Ver pedidos &rarr;</span>
                </Link>
            )}

            {firstMonthLine}

            {/* KPI Cards */}
            <KPIDashboard />

            {/* Additional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-red-200 transition-colors">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                        <Package className="w-5 h-5" style={{ color: RED }} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Productos</p>
                        <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-amber-200 transition-colors">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                        <Settings className="w-5 h-5 text-amber-600" />
                    </div>
                    <Link href="/comercios/mi-comercio" className="group">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mi Comercio</p>
                        <p className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors">Editar perfil &rarr;</p>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-purple-200 transition-colors">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                        <Star className="w-5 h-5 text-purple-600" />
                    </div>
                    <Link href="/comercios/resenas" className="group">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reseñas</p>
                        <p className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors">Ver todas &rarr;</p>
                    </Link>
                </div>
            </div>

            {/* Main Sections Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Orders List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" style={{ color: RED }} />
                            Pedidos Recientes
                        </h2>
                        <Link href="/comercios/pedidos" className="text-sm font-semibold hover:underline" style={{ color: RED }}>
                            Ver todos
                        </Link>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/comercios/pedidos`}
                                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            #{order.orderNumber.slice(-3)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{order.user?.name || "Cliente"}</p>
                                            <p className="text-xs text-gray-500">{formatTime(order.createdAt)}hs</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {/* SUBTOTAL (tu venta), no el total con envío */}
                                        <p className="font-bold text-gray-900 text-sm">${order.subtotal.toLocaleString("es-AR")}</p>
                                        <p className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {ORDER_STATUS_ES[order.status] ?? order.status}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">Todo tranquilo por ahora</p>
                                <p className="text-gray-400 text-sm mt-1">Cuando llegue un pedido, te avisamos con sonido</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-6">
                    <div className="rounded-2xl p-6 text-white shadow-lg overflow-hidden relative" style={{ background: "linear-gradient(135deg, #26272C 0%, #121317 100%)" }}>
                        <Package className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
                        <h3 className="text-lg font-bold mb-2">Impulsá tu tienda</h3>
                        <p className="text-white/70 text-sm mb-6">Mantené tu catálogo actualizado para aparecer en las recomendaciones de los clientes.</p>
                        <Link
                            href="/comercios/productos"
                            className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition"
                            style={{ color: RED }}
                        >
                            Gestionar catálogo &rarr;
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                            Accesos Rápidos
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <Link href="/comercios/mi-comercio" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Editar Mi Comercio</span>
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                            </Link>
                            <Link href="/comercios/soporte" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Ayuda y Soporte</span>
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
