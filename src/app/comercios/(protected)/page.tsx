// Comercios Portal - Dashboard Page
import { Package, ShoppingCart, TrendingUp, Plus, Settings, Clock, AlertCircle, LayoutDashboard, ArrowRight, Star, Gift } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { formatTime } from "@/lib/timezone";
import { prisma } from "@/lib/prisma";
import { checkMerchantSchedule } from "@/lib/merchant-schedule";
import {
    isInFirstMonthFree,
    getFirstMonthFreeEndDate,
    getFirstMonthFreeDaysRemaining,
} from "@/lib/merchant-loyalty";
import KPIDashboard from "./KPIDashboard";
import OnboardingChecklist from "./OnboardingChecklist";

// ISSUE-038: categorías de comida que requieren registro sanitario.
// Debe coincidir con /api/merchant/onboarding para que "canOpenStore"
// se derive igual en el chip del dashboard.
const FOOD_TYPES = [
    "Restaurante", "Pizzería", "Hamburguesería", "Parrilla", "Cafetería",
    "Heladería", "Panadería/Pastelería", "Sushi", "Comida Saludable",
    "Rotisería", "Bebidas", "Vinoteca/Licorería",
];

export default async function ComerciosDashboardPage() {
    const session = await auth();
    const userName = session?.user?.name || "Comerciante";

    // Get merchant for this user
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

    // Get stats & recent orders
    const [activeProducts, pendingOrdersCount, recentOrders] = await Promise.all([
        prisma.product.count({
            where: { merchantId: merchant.id, isActive: true },
        }),
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

    // ISSUE-038: Chip tri-estado (Pendiente / Cerrada / Abierta).
    // "Pendiente" si no está APPROVED o faltan requisitos obligatorios.
    // "Cerrada" si manualmente pausado o fuera de horario.
    // "Abierta" si todo OK + dentro de horario en timezone Ushuaia.
    // La misma lógica de requisitos vive en /api/merchant/onboarding.
    const isFoodBusiness = FOOD_TYPES.includes(merchant.category || "");
    const hasCuit = Boolean(merchant.cuit);
    const hasBankAccount = Boolean(merchant.bankAccount);
    const hasConstanciaAfip = Boolean(merchant.constanciaAfipUrl);
    const hasHabilitacion = Boolean(merchant.habilitacionMunicipalUrl);
    const hasRegistroSanitario = !isFoodBusiness || Boolean(merchant.registroSanitarioUrl);
    const docsComplete = hasCuit && hasBankAccount && hasConstanciaAfip && hasHabilitacion && hasRegistroSanitario;
    const hasSchedule = Boolean(merchant.scheduleJson);
    const hasProducts = activeProducts >= 1;
    const hasAddress = Boolean(merchant.address && merchant.latitude);
    const canOpenStore = docsComplete && hasSchedule && hasProducts && hasAddress;

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
        chipLabel = "Pendiente";
        chipSubtitle = merchant.approvalStatus !== "APPROVED"
            ? "Esperando aprobación"
            : "Completá los requisitos";
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
        pending: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", dotAnim: "" },
        closed: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", dotAnim: "" },
        open: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", dotAnim: "animate-pulse" },
    };
    const chip = chipStyles[chipState];

    // ISSUE-020: Mes 1 gratis (Biblia Financiera v3).
    // Durante los primeros 30 días corridos desde createdAt, el comercio
    // paga 0% de comisión. La lógica canónica vive en getEffectiveCommission;
    // acá solo derivamos el banner informativo. Si hay commissionOverride
    // el mes gratis no aplica (el override gana y puede ser un acuerdo especial).
    const hasCommissionOverride = merchant.commissionOverride !== null && merchant.commissionOverride !== undefined;
    const firstMonthFreeActive = !hasCommissionOverride && isInFirstMonthFree(merchant.createdAt);
    const firstMonthFreeEndDate = getFirstMonthFreeEndDate(merchant.createdAt);
    const firstMonthFreeDaysLeft = firstMonthFreeActive
        ? getFirstMonthFreeDaysRemaining(merchant.createdAt)
        : 0;
    const firstMonthFreeEndLabel = firstMonthFreeEndDate.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 group flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6" style={{ color: "#e60012" }} />
                        Dashboard
                    </h1>
                    <p className="text-gray-500">Bienvenido de nuevo, <span style={{ color: "#e60012" }} className="font-medium">{userName}</span></p>
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
                        style={{ backgroundColor: "#e60012" }}
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden xs:inline">Nuevo Producto</span>
                    </Link>
                </div>
            </div>

            {/* feat/registro-simplificado (2026-04-27): banner persistente para merchants
                pendientes de aprobación. Sin esto el merchant que se registró con datos
                mínimos no entiende qué le falta hacer. Auto-hides cuando approvalStatus=APPROVED. */}
            {merchant.approvalStatus !== "APPROVED" && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-amber-900 text-base mb-1">
                                Tu cuenta está pendiente de activación
                            </h3>
                            <p className="text-sm text-amber-800 mb-2 leading-relaxed">
                                Para que el equipo de Moovy te active y empieces a recibir pedidos, completá los datos
                                que te faltan en la lista de abajo. Te tarda menos de 5 minutos. Mientras tanto, tu
                                tienda <strong>no aparece</strong> en el listado público.
                            </p>
                            <Link
                                href="/comercios/configuracion"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition"
                            >
                                Completar mis datos
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Onboarding Checklist - Only shown if merchant is approved and onboarding incomplete */}
            <OnboardingChecklist />

            {/* ISSUE-020: Banner mes 1 gratis. Solo se muestra mientras la ventana
                está activa. Cuando vence (día 31), desaparece solo y la comisión
                pasa al tier del comercio (BRONCE 8% por default). */}
            {firstMonthFreeActive && (
                <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-900 px-5 py-4 rounded-2xl shadow-sm">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="font-bold block">Tu primer mes en MOOVY: 0% de comisión</span>
                        <span className="text-sm opacity-90">
                            Te {firstMonthFreeDaysLeft === 1 ? "queda 1 día" : `quedan ${firstMonthFreeDaysLeft} días`} sin comisión. Vence el <strong>{firstMonthFreeEndLabel}</strong>.
                        </span>
                    </div>
                    <div className="hidden sm:flex flex-col items-end flex-shrink-0">
                        <span className="text-2xl font-bold text-emerald-600">0%</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Comisión</span>
                    </div>
                </div>
            )}

            {/* Pending Orders Alert */}
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

            {/* KPI Cards */}
            <KPIDashboard />

            {/* Additional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                        <Package className="w-5 h-5 text-blue-600" />
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
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                            Pedidos Recientes
                        </h2>
                        <Link href="/comercios/pedidos" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
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
                                        <p className="font-bold text-gray-900 text-sm">${order.total.toLocaleString("es-AR")}</p>
                                        <p className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {order.status}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">Todo tranquilo por ahora</p>
                                <p className="text-gray-400 text-sm mt-1">Cuando llegue un pedido, te avisamos con sonido</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                        <Package className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
                        <h3 className="text-lg font-bold mb-2">Impulsa tu tienda</h3>
                        <p className="text-blue-100 text-sm mb-6">Manten tu catalogo actualizado para aparecer en las recomendaciones de los clientes.</p>
                        <Link
                            href="/comercios/productos"
                            className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition"
                        >
                            Gestionar Catalogo &rarr;
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                            Accesos Rapidos
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