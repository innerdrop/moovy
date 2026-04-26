"use client";

// OPS — Monitoreo de fraude PIN doble (ISSUE-001).
// Muestra: eventos de auditoría, drivers con fraudScore, suspendidos.
// Permite resetear fraudScore y levantar suspensiones manualmente.

import { useCallback, useEffect, useState } from "react";
import {
    Shield,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    MapPin,
    KeyRound,
    UserX,
    RefreshCw,
    Clock,
    Lock,
    Unlock,
    ExternalLink,
} from "lucide-react";
import { toast } from "@/store/toast";

interface FraudEvent {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    userId: string;
    user: { id: string; name: string | null; email: string } | null;
    details: any;
}

interface FlaggedDriver {
    id: string;
    fraudScore: number;
    isSuspended: boolean;
    suspendedAt: string | null;
    suspensionReason: string | null;
    totalDeliveries: number;
    user: { id: string; name: string | null; email: string; phone: string | null };
}

interface FraudPayload {
    events: FraudEvent[];
    flaggedDrivers: FlaggedDriver[];
    stats: {
        totalEvents: number;
        suspendedDrivers: number;
        flaggedDriversCount: number;
    };
}

// ISSUE-062: visibilidad OPS de cuentas bloqueadas por intentos fallidos.
interface LockedAccount {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    failedLoginAttempts: number;
    loginLockedUntil: string | null;
    updatedAt?: string;
}

interface LockedAccountsPayload {
    currentlyLocked: LockedAccount[];
    recentlyLocked: LockedAccount[];
    stats: {
        lockedNow: number;
        lockedLast24h: number;
    };
}

const actionConfig: Record<string, { label: string; color: string; icon: any }> = {
    PIN_VERIFIED: { label: "PIN verificado", color: "text-green-600 bg-green-50", icon: CheckCircle2 },
    PIN_VERIFICATION_FAIL: { label: "PIN incorrecto", color: "text-orange-600 bg-orange-50", icon: XCircle },
    PIN_LOCKED: { label: "Pedido bloqueado", color: "text-red-600 bg-red-50", icon: AlertTriangle },
    PIN_GEOFENCE_FAIL: { label: "Fuera de zona", color: "text-yellow-600 bg-yellow-50", icon: MapPin },
    DRIVER_AUTO_SUSPENDED: { label: "Auto-suspensión", color: "text-red-700 bg-red-100", icon: UserX },
    DRIVER_FRAUD_RESET: { label: "Reset manual", color: "text-blue-600 bg-blue-50", icon: RefreshCw },
};

export default function FraudePage() {
    const [data, setData] = useState<FraudPayload | null>(null);
    const [lockedData, setLockedData] = useState<LockedAccountsPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resetting, setResetting] = useState<string | null>(null);
    const [unlockingEmail, setUnlockingEmail] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            // Cargamos en paralelo el feed PIN y el feed de cuentas bloqueadas (ISSUE-062).
            const [pinRes, lockedRes] = await Promise.all([
                fetch("/api/admin/fraud/pin-events?limit=150", { cache: "no-store" }),
                fetch("/api/admin/auto-locked-accounts", { cache: "no-store" }),
            ]);
            if (!pinRes.ok) {
                const body = await pinRes.json().catch(() => ({}));
                throw new Error(body.error || "Error al cargar fraude");
            }
            setData(await pinRes.json());
            // Locked accounts es secundario — si falla no rompemos toda la página.
            if (lockedRes.ok) {
                setLockedData(await lockedRes.json());
            }
            setError(null);
        } catch (e: any) {
            setError(e?.message || "Error al cargar");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleUnlockAccount = async (email: string) => {
        if (!confirm(`¿Desbloquear la cuenta de ${email}?`)) return;
        setUnlockingEmail(email);
        try {
            const res = await fetch("/api/admin/users/unlock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Error");
            }
            toast.success("Cuenta desbloqueada");
            await loadData();
        } catch (e: any) {
            toast.error(e?.message || "Error al desbloquear");
        } finally {
            setUnlockingEmail(null);
        }
    };

    useEffect(() => {
        loadData();
        const id = setInterval(loadData, 30_000); // refresh cada 30s
        return () => clearInterval(id);
    }, [loadData]);

    const handleReset = async (driverId: string, opts: { resetScore: boolean; unsuspend: boolean }) => {
        if (!confirm(
            opts.unsuspend
                ? "¿Levantar suspensión y resetear fraudScore? El driver vuelve a estar activo."
                : "¿Resetear fraudScore del driver?"
        )) return;

        setResetting(driverId);
        try {
            const res = await fetch(`/api/admin/fraud/drivers/${driverId}/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(opts),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Error");
            }
            toast.success(opts.unsuspend ? "Driver reactivado" : "Fraud score reseteado");
            await loadData();
        } catch (e: any) {
            toast.error(e?.message || "Error al resetear");
        } finally {
            setResetting(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Monitoreo de Fraude</h1>
                        <p className="text-xs sm:text-sm text-gray-500">
                            PIN doble de entrega — eventos, bloqueos y drivers sospechosos
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refrescar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Eventos PIN</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                        {data?.stats.totalEvents ?? "—"}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Drivers marcados</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-1">
                        {data?.stats.flaggedDriversCount ?? "—"}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Suspendidos</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                        {data?.stats.suspendedDrivers ?? "—"}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Cuentas bloqueadas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                        {lockedData?.stats.lockedNow ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {lockedData?.stats.lockedLast24h ?? 0} en 24h
                    </p>
                </div>
            </div>

            {/* Error / loading */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    {error}
                </div>
            )}
            {loading && !data && (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
                    Cargando...
                </div>
            )}

            {/* Drivers marcados */}
            {data && data.flaggedDrivers.length > 0 && (
                <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            Drivers con fraudScore
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Ordenados por score. Umbral de auto-suspensión: 3.
                        </p>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold">Driver</th>
                                    <th className="text-left px-6 py-3 font-semibold">Contacto</th>
                                    <th className="text-center px-6 py-3 font-semibold">Entregas</th>
                                    <th className="text-center px-6 py-3 font-semibold">Score</th>
                                    <th className="text-center px-6 py-3 font-semibold">Estado</th>
                                    <th className="text-right px-6 py-3 font-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.flaggedDrivers.map((d) => (
                                    <tr key={d.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            {d.user.name || "Sin nombre"}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">
                                            <div className="text-xs">{d.user.email}</div>
                                            {d.user.phone && <div className="text-xs text-gray-400">{d.user.phone}</div>}
                                        </td>
                                        <td className="px-6 py-3 text-center text-gray-600">
                                            {d.totalDeliveries}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${d.fraudScore >= 3 ? "bg-red-100 text-red-700" : d.fraudScore >= 2 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                {d.fraudScore}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            {d.isSuspended ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                                                    <UserX className="w-3 h-3" />
                                                    Suspendido
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                                                    Activo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="inline-flex gap-2">
                                                <button
                                                    disabled={resetting === d.id}
                                                    onClick={() => handleReset(d.id, { resetScore: true, unsuspend: false })}
                                                    className="px-3 py-1 text-xs font-semibold rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Reset score
                                                </button>
                                                {d.isSuspended && (
                                                    <button
                                                        disabled={resetting === d.id}
                                                        onClick={() => handleReset(d.id, { resetScore: true, unsuspend: true })}
                                                        className="px-3 py-1 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        Reactivar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden p-3 space-y-3">
                        {data.flaggedDrivers.map((d) => (
                            <div key={d.id} className="border border-gray-100 rounded-xl p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{d.user.name || "Sin nombre"}</p>
                                        <p className="text-xs text-gray-500 truncate">{d.user.email}</p>
                                    </div>
                                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${d.fraudScore >= 3 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                        {d.fraudScore}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                    <span>{d.totalDeliveries} entregas</span>
                                    {d.isSuspended && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                                            <UserX className="w-3 h-3" />
                                            Suspendido
                                        </span>
                                    )}
                                </div>
                                {d.suspensionReason && (
                                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded p-2">
                                        {d.suspensionReason}
                                    </p>
                                )}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        disabled={resetting === d.id}
                                        onClick={() => handleReset(d.id, { resetScore: true, unsuspend: false })}
                                        className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-gray-200 text-gray-700 disabled:opacity-50"
                                    >
                                        Reset
                                    </button>
                                    {d.isSuspended && (
                                        <button
                                            disabled={resetting === d.id}
                                            onClick={() => handleReset(d.id, { resetScore: true, unsuspend: true })}
                                            className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-green-600 text-white disabled:opacity-50"
                                        >
                                            Reactivar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ISSUE-062: Cuentas bloqueadas por intentos fallidos */}
            {lockedData && (lockedData.currentlyLocked.length > 0 || lockedData.recentlyLocked.length > 0) && (
                <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-red-600" />
                            Cuentas bloqueadas por intentos fallidos
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {lockedData.currentlyLocked.length} bloqueadas ahora · {lockedData.recentlyLocked.length} con intentos en últimas 24h.
                            Contactá proactivamente — un user 15min sin entrar puede irse a la competencia.
                        </p>
                    </div>

                    {/* Bloqueadas AHORA — prioridad alta, botón Desbloquear inline */}
                    {lockedData.currentlyLocked.length > 0 && (
                        <div className="border-b border-gray-100">
                            <div className="px-4 sm:px-6 py-2 bg-red-50">
                                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                                    Bloqueadas ahora ({lockedData.currentlyLocked.length})
                                </p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {lockedData.currentlyLocked.map((u) => {
                                    const unlockAt = u.loginLockedUntil ? new Date(u.loginLockedUntil) : null;
                                    return (
                                        <div key={u.id} className="p-4 flex items-start gap-3 flex-wrap">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-100 text-red-600">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {u.name || "Sin nombre"}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                                                    <span>{u.failedLoginAttempts}/5 intentos</span>
                                                    {unlockAt && (
                                                        <span>
                                                            Auto-unlock: {unlockAt.toLocaleString("es-AR", {
                                                                hour: "2-digit", minute: "2-digit"
                                                            })}
                                                        </span>
                                                    )}
                                                    {u.phone && (
                                                        <a href={`tel:${u.phone}`} className="text-blue-600 hover:underline">
                                                            {u.phone}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <a
                                                    href={`/ops/usuarios/${u.id}`}
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                                                >
                                                    Ver perfil
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                                <button
                                                    disabled={unlockingEmail === u.email}
                                                    onClick={() => handleUnlockAccount(u.email)}
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1"
                                                >
                                                    <Unlock className="w-3 h-3" />
                                                    Desbloquear
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Histórico 24h — solo los que NO están actualmente bloqueados */}
                    {lockedData.recentlyLocked.filter(u => !lockedData.currentlyLocked.some(c => c.id === u.id)).length > 0 && (
                        <div>
                            <div className="px-4 sm:px-6 py-2 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Con intentos fallidos en 24h (ya pueden entrar)
                                </p>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                                {lockedData.recentlyLocked
                                    .filter(u => !lockedData.currentlyLocked.some(c => c.id === u.id))
                                    .map((u) => (
                                        <div key={u.id} className="p-3 flex items-center gap-3 flex-wrap">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 truncate">
                                                    {u.name || u.email}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {u.failedLoginAttempts} intentos · último: {u.updatedAt ? new Date(u.updatedAt).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                                                </p>
                                            </div>
                                            <a
                                                href={`/ops/usuarios/${u.id}`}
                                                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 flex-shrink-0"
                                            >
                                                Ver perfil
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Eventos */}
            <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-gray-500" />
                        Eventos recientes
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Últimos {data?.events.length ?? "—"} eventos de verificación PIN
                    </p>
                </div>

                {data && data.events.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        Sin eventos registrados todavía.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {data?.events.map((e) => {
                            const cfg = actionConfig[e.action] || { label: e.action, color: "text-gray-600 bg-gray-50", icon: Clock };
                            const Icon = cfg.icon;
                            const details = e.details || {};
                            return (
                                <div key={e.id} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center flex-wrap gap-2 text-sm">
                                            <span className="font-semibold text-gray-900">{cfg.label}</span>
                                            {details.pinType && (
                                                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                    {details.pinType === "pickup" ? "retiro" : "entrega"}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {e.entityType} · {e.entityId.slice(-8)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                            {typeof details.attempts === "number" && (
                                                <span>Intentos: {details.attempts}</span>
                                            )}
                                            {typeof details.remaining === "number" && (
                                                <span>Quedan: {details.remaining}</span>
                                            )}
                                            {typeof details.distanceMeters === "number" && (
                                                <span>Distancia: {details.distanceMeters}m</span>
                                            )}
                                            {typeof details.fraudScore === "number" && (
                                                <span className="font-semibold text-orange-600">FraudScore: {details.fraudScore}</span>
                                            )}
                                            {details.driverId && (
                                                <span className="text-gray-400">Driver: {String(details.driverId).slice(-8)}</span>
                                            )}
                                        </div>
                                        {details.note && (
                                            <p className="text-xs text-gray-500 mt-1 italic">"{details.note}"</p>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 flex-shrink-0">
                                        {new Date(e.createdAt).toLocaleString("es-AR", {
                                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
