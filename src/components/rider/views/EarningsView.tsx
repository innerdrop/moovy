"use client";

import { useState, useEffect, useMemo } from "react";
import {
    TrendingUp,
    Calendar,
    ChevronLeft,
    ArrowUp,
    ArrowDown,
    Loader2,
    Wallet,
    Banknote,
    Receipt,
    Info,
} from "lucide-react";
import { formatARS } from "@/lib/format";

interface EarningDay {
    date: string;
    deliveries: number;
    earnings: number;
}

interface EarningsData {
    period: string;
    totalEarnings: number;
    totalDeliveries: number;
    avgPerDelivery: number;
    avgPerDay: number;
    previousPeriodTotal: number;
    dailyBreakdown: EarningDay[];
    // feat/propinas-y-ratings-post-entrega (2026-05-08): propinas declaradas
    // por buyers en este periodo. Informativas — Moovy NO procesa el pago,
    // las recibe el driver directo (efectivo / transferencia al alias).
    totalTipsDeclared?: number;
    totalTipsCount?: number;
    hasBankAlias?: boolean;
}

// Rama feat/driver-driver-historial-ganancias-y-pagos (2026-05-17):
// historial de pagos recibidos del driver (batches PAID).
interface DriverPayout {
    id: string;
    paidAt: string | null;
    amount: number;
    itemCount: number;
    orderIds: string[];
    periodStart: string;
    periodEnd: string;
    bankAccount: string | null;
    batchNotes: string | null;
}

interface PayoutsData {
    payouts: DriverPayout[];
    totalReceived: number;
    count: number;
}

interface EarningsViewProps {
    onBack: () => void;
}

type Tab = "earnings" | "payouts";

/**
 * Genera la lista de opciones del dropdown de período. La 1ra opción es
 * "Esta semana", la 2da "Este mes" (período actual), después los últimos
 * 12 meses como entradas YYYY-MM, y al final "Todo el tiempo".
 *
 * Excluye el mes actual de la lista de meses pasados para evitar
 * confusión con "Este mes" (no queremos mostrar el mismo periodo dos
 * veces con etiquetas distintas).
 */
function buildPeriodOptions(now: Date): { value: string; label: string }[] {
    const months: { value: string; label: string }[] = [];
    // Empezamos en el mes anterior al actual (i=1) para no duplicar "Este mes"
    for (let i = 1; i <= 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
        // Capitalizar primera letra (es-AR devuelve "abril 2026", queremos "Abril 2026")
        months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return [
        { value: "week", label: "Esta semana" },
        { value: "month", label: "Este mes" },
        ...months,
        { value: "all", label: "Todo el tiempo" },
    ];
}

export default function EarningsView({ onBack }: EarningsViewProps) {
    const [activeTab, setActiveTab] = useState<Tab>("earnings");
    const [period, setPeriod] = useState<string>("week");
    const [data, setData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [payoutsData, setPayoutsData] = useState<PayoutsData | null>(null);
    const [payoutsLoading, setPayoutsLoading] = useState(false);

    const periodOptions = useMemo(() => buildPeriodOptions(new Date()), []);

    useEffect(() => {
        if (activeTab !== "earnings") return;
        const fetchEarnings = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/driver/earnings?period=${period}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error("Error fetching earnings:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchEarnings();
    }, [period, activeTab]);

    // Carga lazy: solo pegamos al endpoint de payouts cuando el driver
    // entra al tab. Evita un round-trip extra para los que no lo usan.
    useEffect(() => {
        if (activeTab !== "payouts" || payoutsData) return;
        const fetchPayouts = async () => {
            setPayoutsLoading(true);
            try {
                const res = await fetch(`/api/driver/payouts`);
                if (res.ok) {
                    const json = await res.json();
                    setPayoutsData(json);
                }
            } catch (e) {
                console.error("Error fetching payouts:", e);
            } finally {
                setPayoutsLoading(false);
            }
        };
        fetchPayouts();
    }, [activeTab, payoutsData]);

    const change = data && data.previousPeriodTotal > 0
        ? ((data.totalEarnings - data.previousPeriodTotal) / data.previousPeriodTotal) * 100
        : 0;
    const isPositive = change >= 0;
    // El "vs período anterior" solo aplica a week/month (relativos).
    // Para mes específico o all-time, no mostramos comparación.
    const showComparison = (period === "week" || period === "month") && data && data.previousPeriodTotal > 0;

    const currentPeriodLabel = periodOptions.find((o) => o.value === period)?.label ?? "Esta semana";

    return (
        <div className="absolute inset-0 z-50 bg-gray-50 dark:bg-[#0f1117] flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#e60012] to-[#b8000e] text-white px-4 py-6 shadow-md">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold">Mis Ganancias</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setActiveTab("earnings")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "earnings" ? "bg-white text-[#e60012]" : "bg-white/20 hover:bg-white/30"}`}
                        >
                            <TrendingUp className="w-4 h-4" />
                            Ganancias
                        </button>
                        <button
                            onClick={() => setActiveTab("payouts")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "payouts" ? "bg-white text-[#e60012]" : "bg-white/20 hover:bg-white/30"}`}
                        >
                            <Banknote className="w-4 h-4" />
                            Pagos recibidos
                        </button>
                    </div>

                    {/* Period Selector — solo visible en tab Ganancias */}
                    {activeTab === "earnings" && (
                        <div className="relative">
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="appearance-none bg-white text-[#e60012] font-medium px-4 py-2 pr-10 rounded-lg text-sm cursor-pointer outline-none shadow-sm"
                            >
                                {periodOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#e60012] pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full space-y-6" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
                {activeTab === "earnings" && (
                    loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
                        </div>
                    ) : data ? (
                        <>
                            {/* Main Stats */}
                            <div className="bg-white dark:bg-[#1a1d27] rounded-xl p-6 shadow-sm">
                                <div className="text-center mb-6">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total ganado · {currentPeriodLabel}</p>
                                    <p className="text-4xl font-bold text-gray-900 dark:text-white">${formatARS(data.totalEarnings)}</p>
                                    {showComparison && (
                                        <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                            {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                            {Math.abs(change).toFixed(1)}% vs {period === "week" ? "semana" : "mes"} anterior
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-4 border-t dark:border-white/10">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.totalDeliveries}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Entregas</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">${data.avgPerDelivery}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Por entrega</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">${formatARS(data.avgPerDay)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Por dia</p>
                                    </div>
                                </div>
                            </div>

                            {/* Daily Breakdown */}
                            <div className="bg-white dark:bg-[#1a1d27] rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b dark:border-white/10">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Desglose por dia</h3>
                                </div>
                                {data.dailyBreakdown.length > 0 ? (
                                    <div className="divide-y dark:divide-white/10">
                                        {data.dailyBreakdown.map((day) => (
                                            <div key={day.date} className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-lg flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-[#e60012]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {new Date(day.date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short", year: period === "all" ? "numeric" : undefined })}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{day.deliveries} entrega{day.deliveries !== 1 ? "s" : ""}</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-gray-900 dark:text-white">${formatARS(day.earnings)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center space-y-3">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-[#22252f] rounded-full mx-auto flex items-center justify-center">
                                            <Wallet className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sin entregas en este periodo</p>
                                            <p className="text-xs text-gray-400 mt-1">Probá con otro período del selector de arriba</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* feat/propinas-y-ratings-post-entrega (2026-05-08):
                                seccion de propinas declaradas — Moovy NO las procesa
                                (las recibe el driver directo del buyer en efectivo
                                o por transferencia al alias). Mostramos el monto
                                agregado solo como referencia. */}
                            {(data.totalTipsCount ?? 0) > 0 && (
                                <div className="bg-white dark:bg-[#1a1d27] rounded-xl p-5 shadow-sm border-l-4 border-green-500">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Propinas declaradas</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">${formatARS(data.totalTipsDeclared ?? 0)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {data.totalTipsCount} pedido{data.totalTipsCount !== 1 ? "s" : ""} con propina · cobradas directo del buyer
                                    </p>
                                </div>
                            )}

                            {/* Recordatorio de cargar alias bancario si todavia no tiene */}
                            {data.hasBankAlias === false && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                                                Cargá tu alias para recibir propinas
                                            </p>
                                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                                Sin alias bancario, los buyers solo te pueden dejar propina en efectivo. Cargalo desde tu perfil para que también te puedan transferir.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tips */}
                            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                                <div className="flex items-start gap-3">
                                    <TrendingUp className="w-6 h-6 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold mb-1">Consejo para ganar mas</p>
                                        <p className="text-sm text-white/80">
                                            Los viernes y sabados son los dias con mas pedidos. Mantente activo!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            Error al cargar datos
                        </div>
                    )
                )}

                {/* TAB: Pagos recibidos */}
                {activeTab === "payouts" && (
                    payoutsLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
                        </div>
                    ) : payoutsData ? (
                        <>
                            {/* Total acumulado histórico */}
                            <div className="bg-white dark:bg-[#1a1d27] rounded-xl p-6 shadow-sm">
                                <div className="text-center">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total cobrado en Moovy</p>
                                    <p className="text-4xl font-bold text-gray-900 dark:text-white">${formatARS(payoutsData.totalReceived)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {payoutsData.count} pago{payoutsData.count !== 1 ? "s" : ""} recibido{payoutsData.count !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>

                            {/* Listado de pagos */}
                            <div className="bg-white dark:bg-[#1a1d27] rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b dark:border-white/10">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Historial de pagos</h3>
                                </div>
                                {payoutsData.payouts.length > 0 ? (
                                    <div className="divide-y dark:divide-white/10">
                                        {payoutsData.payouts.map((p) => {
                                            const paidAtLabel = p.paidAt
                                                ? new Date(p.paidAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
                                                : "Sin fecha";
                                            const periodLabel = `${new Date(p.periodStart).toLocaleDateString("es-AR", { day: "numeric", month: "short" })} – ${new Date(p.periodEnd).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}`;
                                            return (
                                                <div key={p.id} className="p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                                            <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                                    Pago del {paidAtLabel}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    Cubre: {periodLabel}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {p.itemCount} pedido{p.itemCount !== 1 ? "s" : ""} incluido{p.itemCount !== 1 ? "s" : ""}
                                                                </p>
                                                                {p.bankAccount && (
                                                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 font-mono truncate">
                                                                        Cuenta: {p.bankAccount}
                                                                    </p>
                                                                )}
                                                                {p.batchNotes && (
                                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 italic line-clamp-2">
                                                                        {p.batchNotes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="font-bold text-lg text-gray-900 dark:text-white flex-shrink-0">
                                                            ${formatARS(p.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center space-y-3">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-[#22252f] rounded-full mx-auto flex items-center justify-center">
                                            <Banknote className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Todavía no recibiste pagos</p>
                                            <p className="text-xs text-gray-400 mt-1">Cuando Moovy procese tu primer pago vas a ver acá el detalle.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Nota explicativa */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-blue-900 dark:text-blue-200">
                                            Acá ves todos los pagos que el equipo de Moovy te transfirió. El detalle de pedidos individuales lo podés ver en el tab "Ganancias" eligiendo el mes que quieras revisar.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            Error al cargar el historial de pagos
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
