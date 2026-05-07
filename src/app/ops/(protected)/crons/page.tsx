"use client";

// OPS — Panel de monitoreo de crons (versión PRO).
// Rama: chore/cron-monitoring-completo
//
// Vista compuesta de 4 piezas:
//   1. Banner de alerta arriba (rojo) si hay crons failing/stale.
//   2. Filtros de estado (chips: Todos / OK / Fallando / Atrasados / Nunca corrió).
//   3. Grid de tarjetas con métricas pro: success rate 24h, tiempo promedio,
//      consecutive failures, botón "Ejecutar ahora", click → drawer con errores.
//   4. Tabla del histórico de corridas (CronRunLog) con filtros por cron + fechas.
//
// Auto-refresh cada 30s. Cuando un cron falla 3 veces seguidas, se envía
// alerta automática por email al admin (sistema de cron-health.ts).

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Clock,
    Loader2,
    ClipboardList,
    Activity,
    Filter,
    Play,
    AlertCircle,
    X as XIcon,
    Zap,
    TrendingDown,
} from "lucide-react";

type CronStatus = "healthy" | "stale" | "never-ran" | "failing";

type CronHealth = {
    jobName: string;
    label: string;
    maxHours: number;
    lastSuccessAt: string | null;
    lastRunAt: string | null;
    lastRunWasSuccess: boolean | null;
    ageHours: number | null;
    status: CronStatus;
    errorMessage: string | null;
    successRate24h: number | null;
    successRate7d: number | null;
    avgDurationMs: number | null;
    totalRuns24h: number;
    totalRuns7d: number;
    consecutiveFailures: number;
};

type RegisteredCron = {
    jobName: string;
    label: string;
    maxHours: number;
};

type CronRun = {
    id: string;
    jobName: string;
    startedAt: string;
    completedAt: string | null;
    success: boolean;
    durationMs: number | null;
    itemsProcessed: number | null;
    errorMessage: string | null;
};

type CronError = {
    id: string;
    startedAt: string;
    completedAt: string | null;
    durationMs: number | null;
    errorMessage: string;
};

const STATUS_META: Record<CronStatus, { label: string; color: string; Icon: any; desc: string; cardBorder: string }> = {
    healthy: {
        label: "OK",
        color: "bg-green-100 text-green-700 border-green-200",
        Icon: CheckCircle2,
        desc: "Último run exitoso dentro de la ventana esperada.",
        cardBorder: "border-green-200",
    },
    stale: {
        label: "Atrasado",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        Icon: Clock,
        desc: "No corrió dentro de su ventana. Revisá el crontab del VPS.",
        cardBorder: "border-amber-300",
    },
    failing: {
        label: "Falló",
        color: "bg-red-100 text-red-700 border-red-200",
        Icon: XCircle,
        desc: "El último intento terminó con error. Click en el cron para ver detalles.",
        cardBorder: "border-red-300",
    },
    "never-ran": {
        label: "Nunca corrió",
        color: "bg-gray-200 text-gray-700 border-gray-300",
        Icon: AlertTriangle,
        desc: "Jamás se registró una corrida. ¿Está configurado en el crontab del VPS?",
        cardBorder: "border-gray-300",
    },
};

function formatDuration(ms: number | null): string {
    if (ms == null) return "—";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60_000).toFixed(1)}min`;
}

function formatRelative(iso: string | null): string {
    if (!iso) return "—";
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "hace segundos";
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days}d`;
    return date.toLocaleDateString("es-AR");
}

type StatusFilter = "all" | CronStatus;

export default function CronsPage() {
    const [health, setHealth] = useState<CronHealth[]>([]);
    const [registered, setRegistered] = useState<RegisteredCron[]>([]);
    const [runs, setRuns] = useState<CronRun[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filtros
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [filterJobName, setFilterJobName] = useState<string>("");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 50;

    // Drawer de errores recientes
    const [drawerJobName, setDrawerJobName] = useState<string | null>(null);
    const [drawerErrors, setDrawerErrors] = useState<CronError[]>([]);
    const [drawerLoading, setDrawerLoading] = useState(false);

    // Trigger manual
    const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
    const [triggerFeedback, setTriggerFeedback] = useState<{ jobName: string; ok: boolean; message: string } | null>(null);

    const load = useCallback(
        async (isRefresh = false) => {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filterJobName) params.set("jobName", filterJobName);
                if (dateFrom) params.set("dateFrom", new Date(dateFrom).toISOString());
                if (dateTo) {
                    const end = new Date(dateTo);
                    end.setHours(23, 59, 59, 999);
                    params.set("dateTo", end.toISOString());
                }
                params.set("take", String(PAGE_SIZE));
                params.set("skip", String(page * PAGE_SIZE));

                const res = await fetch(`/api/admin/crons?${params.toString()}`);
                const data = await res.json();
                if (res.ok) {
                    setHealth(data.health || []);
                    setRegistered(data.registered || []);
                    setRuns(data.runs || []);
                    setTotal(data.total || 0);
                }
            } finally {
                if (isRefresh) setRefreshing(false);
                else setLoading(false);
            }
        },
        [filterJobName, dateFrom, dateTo, page],
    );

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                load(true);
            }
        }, 30_000);
        return () => clearInterval(interval);
    }, [load]);

    const healthByJob = useMemo(() => {
        const map = new Map<string, CronHealth>();
        for (const h of health) map.set(h.jobName, h);
        return map;
    }, [health]);

    const registeredJobNames = useMemo(() => new Set(registered.map((r) => r.jobName)), [registered]);

    // Resumen agregado (para el banner de arriba)
    const summary = useMemo(() => {
        const bucket: Record<CronStatus, number> = {
            healthy: 0,
            stale: 0,
            failing: 0,
            "never-ran": 0,
        };
        for (const h of health) bucket[h.status]++;
        return bucket;
    }, [health]);

    const filteredHealth = useMemo(() => {
        if (statusFilter === "all") return health;
        return health.filter((h) => h.status === statusFilter);
    }, [health, statusFilter]);

    // Trigger manual
    const handleTrigger = async (jobName: string) => {
        if (triggeringJob) return;
        setTriggeringJob(jobName);
        setTriggerFeedback(null);
        try {
            const res = await fetch(`/api/admin/crons/${jobName}/trigger`, { method: "POST" });
            const data = await res.json();
            setTriggerFeedback({
                jobName,
                ok: res.ok && data.ok,
                message: res.ok && data.ok
                    ? `Ejecutado en ${data.durationMs}ms — status ${data.statusCode}`
                    : `Error: ${data.error || data.statusCode || "desconocido"}`,
            });
            // Refrescar datos para ver la nueva corrida
            await load(true);
        } catch (e) {
            setTriggerFeedback({
                jobName,
                ok: false,
                message: e instanceof Error ? e.message : String(e),
            });
        } finally {
            setTriggeringJob(null);
            // Limpiar feedback después de 5s
            setTimeout(() => setTriggerFeedback(null), 5000);
        }
    };

    // Drawer de errores recientes
    const openDrawer = async (jobName: string) => {
        setDrawerJobName(jobName);
        setDrawerLoading(true);
        try {
            const res = await fetch(`/api/admin/crons/${jobName}/errors?take=20`);
            const data = await res.json();
            if (res.ok) setDrawerErrors(data.errors || []);
        } finally {
            setDrawerLoading(false);
        }
    };

    const closeDrawer = () => {
        setDrawerJobName(null);
        setDrawerErrors([]);
    };

    const showAlertBanner = summary.failing > 0 || summary.stale > 0;
    const totalProblematic = summary.failing + summary.stale + summary["never-ran"];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ClipboardList className="w-6 h-6 text-[#e60012]" />
                            Crons del sistema
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Estado de los {registered.length} crons registrados. Auto-refresh cada 30s.
                        </p>
                    </div>
                    <button
                        onClick={() => load(true)}
                        className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        Actualizar
                    </button>
                </div>

                {/* Banner de alerta arriba si hay problemas */}
                {showAlertBanner && (
                    <div className="mb-5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-5 shadow-lg shadow-red-500/20">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold mb-1">
                                    {summary.failing > 0 && summary.stale > 0
                                        ? `${summary.failing} cron(s) fallando + ${summary.stale} atrasado(s)`
                                        : summary.failing > 0
                                            ? `${summary.failing} cron${summary.failing > 1 ? "s" : ""} fallando`
                                            : `${summary.stale} cron${summary.stale > 1 ? "s atrasados" : " atrasado"}`}
                                </h2>
                                <p className="text-sm text-white/90">
                                    Necesita atención inmediata. Revisá las tarjetas afectadas abajo o usá el filtro para verlas.
                                </p>
                            </div>
                            <button
                                onClick={() => setStatusFilter(summary.failing > 0 ? "failing" : "stale")}
                                className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                            >
                                Ver afectados
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats agregadas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">OK</p>
                        <p className="text-2xl font-extrabold text-green-600 mt-1">{summary.healthy}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Atrasados</p>
                        <p className="text-2xl font-extrabold text-amber-600 mt-1">{summary.stale}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fallando</p>
                        <p className="text-2xl font-extrabold text-red-600 mt-1">{summary.failing}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nunca corrió</p>
                        <p className="text-2xl font-extrabold text-gray-600 mt-1">{summary["never-ran"]}</p>
                    </div>
                </div>

                {/* Filtros de estado (chips) */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                    <span className="text-xs text-gray-500 font-semibold mr-1 flex-shrink-0">Filtrar:</span>
                    {[
                        { key: "all" as StatusFilter, label: "Todos", count: health.length, color: "gray" },
                        { key: "healthy" as StatusFilter, label: "OK", count: summary.healthy, color: "green" },
                        { key: "failing" as StatusFilter, label: "Fallando", count: summary.failing, color: "red" },
                        { key: "stale" as StatusFilter, label: "Atrasados", count: summary.stale, color: "amber" },
                        { key: "never-ran" as StatusFilter, label: "Nunca corrió", count: summary["never-ran"], color: "gray" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === f.key
                                ? f.color === "red" ? "bg-red-600 text-white" :
                                    f.color === "amber" ? "bg-amber-500 text-white" :
                                        f.color === "green" ? "bg-green-600 text-white" :
                                            "bg-gray-700 text-white"
                                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            {f.label}
                            <span className={`text-[10px] ${statusFilter === f.key ? "text-white/80" : "text-gray-400"}`}>
                                ({f.count})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Feedback de trigger manual */}
                {triggerFeedback && (
                    <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${triggerFeedback.ok
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                        }`}>
                        {triggerFeedback.ok ? "✓" : "✗"} <strong>{triggerFeedback.jobName}:</strong> {triggerFeedback.message}
                    </div>
                )}

                {/* Grid de cards mejoradas */}
                <section className="mb-8">
                    {loading && health.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-xl border border-gray-100">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : filteredHealth.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-xl border border-gray-100">
                            <p className="text-gray-400 text-sm">No hay crons en el filtro seleccionado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredHealth.map((h) => {
                                const meta = STATUS_META[h.status];
                                const isRegistered = registeredJobNames.has(h.jobName);
                                const isTriggering = triggeringJob === h.jobName;
                                return (
                                    <div
                                        key={h.jobName}
                                        className={`bg-white rounded-xl border-2 ${meta.cardBorder} p-4 hover:shadow-md transition-shadow`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-sm text-gray-900 leading-tight">{h.label}</p>
                                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{h.jobName}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold flex-shrink-0 ${meta.color}`}>
                                                <meta.Icon className="w-3 h-3" />
                                                {meta.label}
                                            </span>
                                        </div>

                                        {/* Consecutive failures destacados si > 0 */}
                                        {h.consecutiveFailures > 0 && (
                                            <div className="mb-2 inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                                                <TrendingDown className="w-3 h-3" />
                                                {h.consecutiveFailures} fallo{h.consecutiveFailures > 1 ? "s" : ""} seguido{h.consecutiveFailures > 1 ? "s" : ""}
                                            </div>
                                        )}

                                        <div className="space-y-1.5 text-xs mb-3">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Última corrida:</span>
                                                <span className="font-medium">{formatRelative(h.lastRunAt)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Último éxito:</span>
                                                <span className="font-medium">{formatRelative(h.lastSuccessAt)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Tiempo promedio:</span>
                                                <span className="font-medium">{formatDuration(h.avgDurationMs)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Corridas 24h:</span>
                                                <span className="font-medium">{h.totalRuns24h.toLocaleString("es-AR")}</span>
                                            </div>
                                        </div>

                                        {/* Success rate 24h con barra mini */}
                                        {h.successRate24h !== null && (
                                            <div className="mb-2">
                                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                    <span>Success rate 24h</span>
                                                    <span className={`font-bold ${h.successRate24h >= 95 ? "text-green-600"
                                                        : h.successRate24h >= 80 ? "text-amber-600"
                                                            : "text-red-600"
                                                        }`}>
                                                        {h.successRate24h}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${h.successRate24h >= 95 ? "bg-green-500"
                                                            : h.successRate24h >= 80 ? "bg-amber-500"
                                                                : "bg-red-500"
                                                            }`}
                                                        style={{ width: `${h.successRate24h}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {h.errorMessage && (
                                            <div className="mt-2 bg-red-50 border border-red-100 rounded px-2 py-1.5">
                                                <p className="text-[10px] text-red-700 font-mono leading-tight break-all line-clamp-2">
                                                    {h.errorMessage}
                                                </p>
                                            </div>
                                        )}

                                        {!isRegistered && (
                                            <p className="mt-2 text-[10px] text-gray-400 italic">
                                                ⚠ Legacy: tiene runs en DB pero ya no está en CRON_EXPECTATIONS.
                                            </p>
                                        )}

                                        {/* Acciones */}
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                                            <button
                                                onClick={() => handleTrigger(h.jobName)}
                                                disabled={isTriggering || !isRegistered}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#e60012] hover:bg-[#cc000f] text-white text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isTriggering ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Play className="w-3 h-3" />
                                                )}
                                                Ejecutar ahora
                                            </button>
                                            <button
                                                onClick={() => openDrawer(h.jobName)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Zap className="w-3 h-3" />
                                                Ver errores
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Tabla histórica (igual que antes) */}
                <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-gray-700" />
                            <h2 className="text-sm font-semibold text-gray-700">Historial de corridas</h2>
                            <span className="text-xs text-gray-400">
                                ({total.toLocaleString("es-AR")} registros)
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Cron
                                </label>
                                <select
                                    value={filterJobName}
                                    onChange={(e) => {
                                        setFilterJobName(e.target.value);
                                        setPage(0);
                                    }}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">Todos</option>
                                    {registered.map((r) => (
                                        <option key={r.jobName} value={r.jobName}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Desde
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => {
                                        setDateFrom(e.target.value);
                                        setPage(0);
                                    }}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Hasta
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => {
                                        setDateTo(e.target.value);
                                        setPage(0);
                                    }}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        {(filterJobName || dateFrom || dateTo) && (
                            <button
                                onClick={() => {
                                    setFilterJobName("");
                                    setDateFrom("");
                                    setDateTo("");
                                    setPage(0);
                                }}
                                className="mt-3 text-xs text-[#e60012] hover:underline inline-flex items-center gap-1"
                            >
                                <Filter className="w-3 h-3" />
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {loading && runs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : runs.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 text-sm">
                            No hay corridas registradas con estos filtros.
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            <th className="px-5 py-3">Cron</th>
                                            <th className="px-5 py-3">Inicio</th>
                                            <th className="px-5 py-3">Duración</th>
                                            <th className="px-5 py-3">Items</th>
                                            <th className="px-5 py-3">Resultado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {runs.map((run) => {
                                            const label = healthByJob.get(run.jobName)?.label || run.jobName;
                                            return (
                                                <tr key={run.id} className="hover:bg-gray-50">
                                                    <td className="px-5 py-3">
                                                        <p className="font-medium text-gray-900">{label}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono">{run.jobName}</p>
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600">
                                                        {new Date(run.startedAt).toLocaleString("es-AR", {
                                                            timeZone: "America/Argentina/Ushuaia",
                                                        })}
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600">{formatDuration(run.durationMs)}</td>
                                                    <td className="px-5 py-3 text-gray-600">
                                                        {run.itemsProcessed !== null ? run.itemsProcessed.toLocaleString("es-AR") : "—"}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {run.success ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-green-700">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                OK
                                                            </span>
                                                        ) : run.completedAt ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-red-700">
                                                                <XCircle className="w-3 h-3" />
                                                                Falló
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                En curso
                                                            </span>
                                                        )}
                                                        {run.errorMessage && (
                                                            <p className="text-[10px] text-red-600 font-mono mt-1 max-w-xs truncate" title={run.errorMessage}>
                                                                {run.errorMessage}
                                                            </p>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <ul className="md:hidden divide-y divide-gray-100">
                                {runs.map((run) => {
                                    const label = healthByJob.get(run.jobName)?.label || run.jobName;
                                    return (
                                        <li key={run.id} className="px-4 py-3">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="font-medium text-sm text-gray-900">{label}</p>
                                                {run.success ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        OK
                                                    </span>
                                                ) : run.completedAt ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                                        <XCircle className="w-3 h-3" />
                                                        Falló
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                                        En curso
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-gray-500 space-y-0.5">
                                                <p>{new Date(run.startedAt).toLocaleString("es-AR")}</p>
                                                <p>
                                                    Duración: <strong>{formatDuration(run.durationMs)}</strong>
                                                    {run.itemsProcessed !== null && (
                                                        <>
                                                            {" · "}Items: <strong>{run.itemsProcessed}</strong>
                                                        </>
                                                    )}
                                                </p>
                                                {run.errorMessage && (
                                                    <p className="text-red-600 font-mono text-[10px] mt-1">{run.errorMessage}</p>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            {total > PAGE_SIZE && (
                                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                                    <span>
                                        {page * PAGE_SIZE + 1} – {Math.min((page + 1) * PAGE_SIZE, total)} de {total.toLocaleString("es-AR")}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                                        >
                                            Anterior
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => p + 1)}
                                            disabled={(page + 1) * PAGE_SIZE >= total}
                                            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>

                <p className="text-xs text-gray-400 mt-6">
                    Los crons se disparan desde el crontab del VPS. Si un cron falla 3 veces seguidas,
                    se envía alerta automática por email al admin. Logs detallados en{" "}
                    <code className="bg-gray-100 px-1 rounded">/var/log/moovy-cron.log</code> del VPS.
                </p>
            </div>

            {/* Drawer de errores recientes */}
            {drawerJobName && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeDrawer}>
                    <div
                        className="bg-white w-full sm:max-w-2xl max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">Errores recientes</h3>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{drawerJobName}</p>
                            </div>
                            <button
                                onClick={closeDrawer}
                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                            >
                                <XIcon className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            {drawerLoading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                                </div>
                            ) : drawerErrors.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-sm">
                                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                    Este cron no registró errores en los últimos runs.
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {drawerErrors.map((err) => (
                                        <li key={err.id} className="bg-red-50 border border-red-100 rounded-xl p-4">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="text-xs text-gray-600">
                                                    <p className="font-bold">
                                                        {new Date(err.startedAt).toLocaleString("es-AR", {
                                                            timeZone: "America/Argentina/Ushuaia",
                                                        })}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        Duración: {formatDuration(err.durationMs)}
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                                    <XCircle className="w-3 h-3" />
                                                    Falló
                                                </span>
                                            </div>
                                            <pre className="text-xs text-red-800 font-mono whitespace-pre-wrap break-all bg-white/50 rounded p-2 mt-2">
                                                {err.errorMessage}
                                            </pre>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
