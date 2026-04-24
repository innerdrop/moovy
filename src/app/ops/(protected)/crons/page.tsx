"use client";

// OPS — Panel de monitoreo de crons.
// Vista compuesta de dos piezas:
//   1. Grid de tarjetas con el estado actual de cada cron registrado
//      (healthy / stale / failing / never-ran). Auto-refresh cada 30s.
//   2. Tabla del histórico de corridas (CronRunLog) con filtros por cron + fechas.
//
// Cuando un cron falla o deja de correr, el dashboard OPS (`/ops/dashboard`)
// pone una alerta con link acá — desde acá el admin ve el historial completo
// y decide si es problema del runner externo (crontab del VPS) o del código.

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

const STATUS_META: Record<CronStatus, { label: string; color: string; Icon: any; desc: string }> = {
    healthy: {
        label: "OK",
        color: "bg-green-100 text-green-700 border-green-200",
        Icon: CheckCircle2,
        desc: "Último run exitoso dentro de la ventana esperada.",
    },
    stale: {
        label: "Atrasado",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        Icon: Clock,
        desc: "No corrió dentro de su ventana. Revisá el runner externo (crontab del VPS).",
    },
    failing: {
        label: "Falló",
        color: "bg-red-100 text-red-700 border-red-200",
        Icon: XCircle,
        desc: "El último intento terminó con error. Ver el mensaje abajo.",
    },
    "never-ran": {
        label: "Nunca corrió",
        color: "bg-gray-200 text-gray-700 border-gray-300",
        Icon: AlertTriangle,
        desc: "Jamás se registró una corrida. ¿Está configurado en el crontab del VPS?",
    },
};

function formatDuration(ms: number | null): string {
    if (ms == null) return "—";
    if (ms < 1000) return `${ms}ms`;
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

export default function CronsPage() {
    const [health, setHealth] = useState<CronHealth[]>([]);
    const [registered, setRegistered] = useState<RegisteredCron[]>([]);
    const [runs, setRuns] = useState<CronRun[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filtros
    const [filterJobName, setFilterJobName] = useState<string>("");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 50;

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

    // Auto-refresh cada 30s. Solo refresca si la pestaña está visible
    // (document.visibilityState) para no gastar queries innecesarias.
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                load(true);
            }
        }, 30_000);
        return () => clearInterval(interval);
    }, [load]);

    // Derivamos un mapa de cron → health para mostrar en la tabla de runs
    const healthByJob = useMemo(() => {
        const map = new Map<string, CronHealth>();
        for (const h of health) map.set(h.jobName, h);
        return map;
    }, [health]);

    // Si un cron está registrado pero nunca corrió, health lo incluye con status "never-ran".
    // Si uno está en health pero no en registered, es un cron legacy (sacado del código
    // pero con runs viejos en DB). Lo mostramos con un badge distinto.
    const registeredJobNames = useMemo(() => new Set(registered.map((r) => r.jobName)), [registered]);

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

                {/* Grid de estado actual */}
                <section className="mb-8">
                    {loading && health.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-xl border border-gray-100">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {health.map((h) => {
                                const meta = STATUS_META[h.status];
                                const isRegistered = registeredJobNames.has(h.jobName);
                                return (
                                    <div
                                        key={h.jobName}
                                        className={`bg-white rounded-xl border-2 p-4 ${h.status === "healthy" ? "border-green-200" :
                                            h.status === "stale" ? "border-amber-200" :
                                                h.status === "failing" ? "border-red-200" :
                                                    "border-gray-200"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-sm text-gray-900">{h.label}</p>
                                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{h.jobName}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${meta.color}`}>
                                                <meta.Icon className="w-3 h-3" />
                                                {meta.label}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mb-3 leading-snug">{meta.desc}</p>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Ventana esperada:</span>
                                                <span className="font-medium">cada {h.maxHours}h</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Último éxito:</span>
                                                <span className="font-medium">{formatRelative(h.lastSuccessAt)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Último intento:</span>
                                                <span className="font-medium">{formatRelative(h.lastRunAt)}</span>
                                            </div>
                                        </div>
                                        {h.errorMessage && (
                                            <div className="mt-3 bg-red-50 border border-red-100 rounded px-2 py-1.5">
                                                <p className="text-[11px] text-red-700 font-mono leading-tight break-all">
                                                    {h.errorMessage}
                                                </p>
                                            </div>
                                        )}
                                        {!isRegistered && (
                                            <p className="mt-2 text-[10px] text-gray-400 italic">
                                                ⚠ Legacy: tiene runs en DB pero ya no está en CRON_EXPECTATIONS.
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Filtros + Tabla histórica */}
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
                            {/* Desktop: tabla */}
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

                            {/* Mobile: cards */}
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

                            {/* Paginación */}
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
                    Los crons se disparan desde el crontab del VPS (no desde la app). Si un cron aparece
                    como "Nunca corrió" o "Atrasado", revisá <code className="bg-gray-100 px-1 rounded">crontab -l</code> en
                    el VPS o consultá <code className="bg-gray-100 px-1 rounded">DEPLOY_CHECKLIST.md</code> sección 4.0.
                </p>
            </div>
        </div>
    );
}
