"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
    Calculator, TrendingUp, TrendingDown, Loader2, Download, Truck,
    AlertTriangle, Target, Pencil, Check, X, Info,
} from "lucide-react";
import { formatPrice } from "@/lib/delivery";

interface Row {
    id: string;
    orderNumber: string;
    createdAt: string;
    isMultiVendor: boolean;
    subtotal: number;
    deliveryFee: number;
    deliveryPct: number;
    moovyCommission: number;
    driverPayout: number;
    mpCost: number;
    discount: number;
    margin: number;
}

interface UEData {
    period: string;
    config: { fixedMonthlyCost: number; mpFeePercent: number };
    summary: {
        orderCount: number;
        moovyRevenue: number;
        moovyCommissionTotal: number;
        deliveryMarginTotal: number;
        mpCostTotal: number;
        discountTotal: number;
        driverPayoutTotal: number;
        contributionMargin: number;
        avgMarginPerOrder: number;
        avgDeliveryPct: number;
        avgDriverPayout: number;
        avgDistance: number | null;
        negativeMarginCount: number;
        highDeliveryShareCount: number;
    };
    breakEven: {
        fixedMonthlyCost: number;
        avgMarginPerOrder: number;
        ordersToBreakEven: number | null;
        ordersThisMonth: number;
        breakEvenProgressPct: number;
    };
    rows: Row[];
}

const PERIODS = [
    { value: "7", label: "7 días" },
    { value: "30", label: "30 días" },
    { value: "90", label: "90 días" },
    { value: "all", label: "Todo" },
];

export default function UnitEconomicsPage() {
    const [data, setData] = useState<UEData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [period, setPeriod] = useState("30");

    // edición inline de gastos fijos
    const [editingFixed, setEditingFixed] = useState(false);
    const [fixedInput, setFixedInput] = useState("");
    const [savingFixed, setSavingFixed] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        setError(false);
        fetch(`/api/ops/unit-economics?period=${period}`)
            .then((r) => {
                if (!r.ok) throw new Error("fetch failed");
                return r.json();
            })
            .then((d: UEData) => setData(d))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [period]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const saveFixedCost = async () => {
        const val = Number(fixedInput);
        if (!Number.isFinite(val) || val < 0) return;
        setSavingFixed(true);
        try {
            const r = await fetch("/api/ops/unit-economics", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fixedMonthlyCost: val }),
            });
            if (r.ok) {
                setEditingFixed(false);
                fetchData();
            }
        } finally {
            setSavingFixed(false);
        }
    };

    const exportCSV = () => {
        if (!data) return;
        const header = ["Pedido", "Fecha", "Subtotal", "Envío", "Envío %", "Comisión Moovy", "Payout Driver", "Costo MP", "Descuento", "Margen"];
        const lines = data.rows.map((row) => [
            row.orderNumber,
            new Date(row.createdAt).toLocaleDateString("es-AR"),
            row.subtotal, row.deliveryFee, row.deliveryPct,
            row.moovyCommission, row.driverPayout, row.mpCost, row.discount, row.margin,
        ].join(","));
        const csv = [header.join(","), ...lines].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `unit-economics-${period}-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Estados ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500 mb-4">No se pudieron cargar los datos.</p>
                <button onClick={fetchData} className="px-4 py-2 bg-[#e60012] text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
                    Reintentar
                </button>
            </div>
        );
    }

    if (!data) return null;

    const { summary, breakEven } = data;
    const marginPositive = summary.contributionMargin >= 0;

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e60012]/10 flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-[#e60012]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Unit Economics</h1>
                        <p className="text-sm text-gray-500">Margen real por pedido y break-even — sobre pedidos entregados</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {PERIODS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${period === p.value ? "bg-white text-[#e60012] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {data.rows.length > 0 && (
                        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            <Download className="w-4 h-4" /> CSV
                        </button>
                    )}
                </div>
            </div>

            {summary.orderCount === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
                    <Calculator className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">Todavía no hay pedidos entregados en este período</p>
                    <p className="text-sm text-gray-400 mt-1">Cuando empiecen a entregarse pedidos, vas a ver acá el margen real y el break-even.</p>
                </div>
            ) : (
                <>
                    {/* KPI principal: margen de contribución */}
                    <div className={`rounded-2xl p-5 border ${marginPositive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Margen de contribución ({data.period === "all" ? "histórico" : `${data.period}d`})</p>
                                <p className={`text-3xl font-bold mt-1 ${marginPositive ? "text-green-700" : "text-red-700"}`}>
                                    {formatPrice(summary.contributionMargin)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {formatPrice(summary.avgMarginPerOrder)} por pedido · {summary.orderCount} pedidos
                                </p>
                            </div>
                            {marginPositive
                                ? <TrendingUp className="w-8 h-8 text-green-500" />
                                : <TrendingDown className="w-8 h-8 text-red-500" />}
                        </div>
                    </div>

                    {/* Desglose ingreso/costo */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Card label="Ingreso Moovy" value={formatPrice(summary.moovyRevenue)} sub={`Comisiones ${formatPrice(summary.moovyCommissionTotal)} + envío ${formatPrice(summary.deliveryMarginTotal)}`} />
                        <Card label="Costo MercadoPago" value={formatPrice(summary.mpCostTotal)} sub={`${data.config.mpFeePercent}% del total`} negative />
                        <Card label="Descuentos absorbidos" value={formatPrice(summary.discountTotal)} sub="Cupones (los come Moovy)" negative={summary.discountTotal > 0} />
                        <Card label="Pagado a repartidores" value={formatPrice(summary.driverPayoutTotal)} sub={`${formatPrice(summary.avgDriverPayout)} por viaje`} />
                    </div>

                    {/* Indicadores secundarios */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Indicator icon={<Truck className="w-4 h-4" />} label="Envío s/ subtotal" value={`${summary.avgDeliveryPct}%`} hint="Promedio. Alto = riesgo de conversión" />
                        <Indicator icon={<Info className="w-4 h-4" />} label="Distancia promedio" value={summary.avgDistance != null ? `${summary.avgDistance} km` : "—"} />
                        <Indicator
                            icon={<AlertTriangle className="w-4 h-4" />}
                            label="Envío > 40% del pedido"
                            value={`${summary.highDeliveryShareCount}`}
                            warn={summary.highDeliveryShareCount > 0}
                            hint="Pedidos chicos donde el envío pesa mucho"
                        />
                        <Indicator
                            icon={<AlertTriangle className="w-4 h-4" />}
                            label="Pedidos con margen negativo"
                            value={`${summary.negativeMarginCount}`}
                            warn={summary.negativeMarginCount > 0}
                            hint="Pedidos donde Moovy perdió plata"
                        />
                    </div>

                    {/* Break-even */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-5 h-5 text-[#e60012]" />
                            <h2 className="font-bold text-gray-900">Break-even mensual</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Gastos fijos editable */}
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Gastos fijos / mes</p>
                                {editingFixed ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={fixedInput}
                                            onChange={(e) => setFixedInput(e.target.value)}
                                            className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                            autoFocus
                                        />
                                        <button onClick={saveFixedCost} disabled={savingFixed} className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition disabled:opacity-50">
                                            {savingFixed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => setEditingFixed(false)} className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 transition">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold text-gray-900">{formatPrice(breakEven.fixedMonthlyCost)}</span>
                                        <button
                                            onClick={() => { setFixedInput(String(breakEven.fixedMonthlyCost)); setEditingFixed(true); }}
                                            className="p-1 text-gray-400 hover:text-[#e60012] transition"
                                            title="Editar gastos fijos"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Margen por pedido</p>
                                <span className="text-xl font-bold text-gray-900">{formatPrice(breakEven.avgMarginPerOrder)}</span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Pedidos/mes para cubrir gastos</p>
                                <span className="text-xl font-bold text-[#e60012]">
                                    {breakEven.ordersToBreakEven != null ? breakEven.ordersToBreakEven.toLocaleString("es-AR") : "—"}
                                </span>
                            </div>
                        </div>

                        {/* Progreso del mes */}
                        {breakEven.ordersToBreakEven != null && (
                            <div className="mt-5">
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                    <span className="text-gray-600">Este mes: {breakEven.ordersThisMonth} de {breakEven.ordersToBreakEven} pedidos</span>
                                    <span className="font-medium text-gray-900">{breakEven.breakEvenProgressPct}%</span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${breakEven.breakEvenProgressPct >= 100 ? "bg-green-500" : "bg-[#e60012]"}`}
                                        style={{ width: `${breakEven.breakEvenProgressPct}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1.5">
                                    {breakEven.breakEvenProgressPct >= 100
                                        ? "✅ Gastos fijos cubiertos este mes"
                                        : `Te faltan ${(breakEven.ordersToBreakEven - breakEven.ordersThisMonth).toLocaleString("es-AR")} pedidos para cubrir los gastos fijos`}
                                </p>
                            </div>
                        )}
                        {breakEven.ordersToBreakEven == null && (
                            <p className="text-sm text-red-600 mt-4">⚠️ El margen por pedido es 0 o negativo: no hay break-even posible con estos números. Revisá tarifas y comisiones.</p>
                        )}
                    </div>

                    {/* Tabla por pedido */}
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900 text-sm">Detalle por pedido <span className="font-normal text-gray-400">(últimos {data.rows.length})</span></h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                                        <th className="px-4 py-2 font-medium">Pedido</th>
                                        <th className="px-4 py-2 font-medium text-right">Subtotal</th>
                                        <th className="px-4 py-2 font-medium text-right">Envío</th>
                                        <th className="px-4 py-2 font-medium text-right">Envío %</th>
                                        <th className="px-4 py-2 font-medium text-right">Comisión</th>
                                        <th className="px-4 py-2 font-medium text-right">Driver</th>
                                        <th className="px-4 py-2 font-medium text-right">MP</th>
                                        <th className="px-4 py-2 font-medium text-right">Margen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.rows.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="px-4 py-2.5">
                                                <span className="font-medium text-gray-700">#{row.orderNumber}</span>
                                                {row.isMultiVendor && <span className="ml-1.5 text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded">multi</span>}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">{formatPrice(row.subtotal)}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">{formatPrice(row.deliveryFee)}</td>
                                            <td className={`px-4 py-2.5 text-right ${row.deliveryPct > 40 ? "text-amber-600 font-medium" : "text-gray-400"}`}>{row.deliveryPct}%</td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">{formatPrice(row.moovyCommission)}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-500">−{formatPrice(row.driverPayout)}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-500">−{formatPrice(row.mpCost)}</td>
                                            <td className={`px-4 py-2.5 text-right font-semibold ${row.margin >= 0 ? "text-green-600" : "text-red-600"}`}>{formatPrice(row.margin)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Lee los snapshots financieros congelados de cada pedido. No recalcula cobros. Costo MP y gastos fijos son parámetros de reporte editables (no afectan lo que se cobra).
                    </p>
                </>
            )}
        </div>
    );
}

function Card({ label, value, sub, negative }: { label: string; value: string; sub?: string; negative?: boolean }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-lg font-bold mt-1 ${negative ? "text-gray-700" : "text-gray-900"}`}>{negative ? "−" : ""}{value}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{sub}</p>}
        </div>
    );
}

function Indicator({ icon, label, value, hint, warn }: { icon: ReactNode; label: string; value: string; hint?: string; warn?: boolean }) {
    return (
        <div className={`rounded-xl p-4 border ${warn ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}>
            <div className={`flex items-center gap-1.5 text-xs ${warn ? "text-amber-700" : "text-gray-500"}`}>
                {icon}<span>{label}</span>
            </div>
            <p className={`text-xl font-bold mt-1 ${warn ? "text-amber-700" : "text-gray-900"}`}>{value}</p>
            {hint && <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{hint}</p>}
        </div>
    );
}
