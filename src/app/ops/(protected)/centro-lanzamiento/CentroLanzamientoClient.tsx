"use client";

// feat/centro-lanzamiento: 4 tarjetas con estado en vivo + acciones de un click.
//
// 1. Comisión mes 1  → informativo. Es automático per-merchant (createdAt). Sin acción.
// 2. Boost de puntos → un botón activa ×2 por 30 días; se apaga SOLO al vencer la fecha.
// 3. Publicidad Fase 2 → contador de comercios activos + toggle del flag merchant.publicidad.
// 4. Precio nafta    → valor actual editable inline (reusa /api/admin/ops-config).
//
// Nada de esto requiere recordar fechas: el panel muestra el estado y avisa cuándo conviene.

import { useState, useEffect, useCallback } from "react";
import {
    Rocket,
    Loader2,
    Zap,
    Store,
    Fuel,
    Percent,
    CheckCircle,
    Clock,
    ToggleLeft,
    ToggleRight,
    Info,
} from "lucide-react";
import { toast } from "@/store/toast";

interface FirstMonthMerchant {
    id: string;
    name: string;
    daysRemaining: number;
}

interface LaunchStatus {
    commission: { automatic: boolean; firstMonthList: FirstMonthMerchant[] };
    boost: { active: boolean; multiplier: number; until: string | null; daysRemaining: number };
    publicidad: {
        enabled: boolean;
        exists: boolean;
        activeMerchants: number;
        threshold: number;
        thresholdReached: boolean;
    };
    fuel: { pricePerLiter: number };
}

function Card({
    icon,
    title,
    subtitle,
    children,
    accent = "slate",
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
    accent?: "slate" | "red" | "violet" | "amber" | "green";
}) {
    const accentBg: Record<string, string> = {
        slate: "bg-slate-100 text-slate-600",
        red: "bg-red-50 text-[#e60012]",
        violet: "bg-violet-50 text-violet-600",
        amber: "bg-amber-50 text-amber-600",
        green: "bg-green-50 text-green-600",
    };
    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${accentBg[accent]}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <h2 className="text-base font-black text-slate-800">{title}</h2>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

export default function CentroLanzamientoClient() {
    const [status, setStatus] = useState<LaunchStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [fuelInput, setFuelInput] = useState("");

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/launch");
            const data = await res.json();
            if (res.ok) {
                setStatus(data);
                setFuelInput(String(data.fuel.pricePerLiter));
            } else {
                toast.error(data.error || "Error al cargar el estado");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    async function toggleBoost(activate: boolean) {
        setBusy("boost");
        try {
            const res = await fetch("/api/admin/launch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    activate ? { action: "activate-boost", multiplier: 2, days: 30 } : { action: "deactivate-boost" }
                ),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Listo");
                await fetchStatus();
            } else {
                toast.error(data.error || "Error");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setBusy(null);
        }
    }

    async function togglePublicidad(enable: boolean) {
        setBusy("publicidad");
        try {
            const res = await fetch("/api/admin/features/merchant.publicidad", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: enable }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Publicidad ${enable ? "ACTIVADA" : "desactivada"}`);
                await fetchStatus();
            } else {
                toast.error(data.error || "Error al cambiar la publicidad");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setBusy(null);
        }
    }

    async function saveFuel() {
        const value = parseFloat(fuelInput);
        if (isNaN(value) || value < 100 || value > 5000) {
            toast.error("El precio debe estar entre $100 y $5.000");
            return;
        }
        if (status && value === status.fuel.pricePerLiter) {
            toast.info("Sin cambios");
            return;
        }
        setBusy("fuel");
        try {
            const res = await fetch("/api/admin/ops-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ section: "delivery", data: { fuelPricePerLiter: value } }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Precio de nafta actualizado");
                await fetchStatus();
            } else {
                toast.error(data.error || "Error al guardar");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setBusy(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!status) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
                    No se pudo cargar el estado. Reintentá recargando la página.
                </div>
            </div>
        );
    }

    const fmtDate = (iso: string | null) =>
        iso ? new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="mb-6 flex items-center gap-2">
                <Rocket className="h-6 w-6 text-[#e60012]" />
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Centro de Lanzamiento</h1>
                    <p className="text-sm text-slate-500">
                        Todo lo del lanzamiento en un lugar. Lo que es automático te lo muestro; lo que necesita tu decisión, un click.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* 1. Comisión mes 1 — automático */}
                <Card
                    icon={<Percent className="h-5 w-5" />}
                    title="Comisión mes 1"
                    subtitle="Automático — no tenés que hacer nada"
                    accent="green"
                >
                    <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
                        <CheckCircle className="mb-1 inline h-4 w-4" /> Cada comercio paga <strong>0% sus primeros 30 días</strong>{" "}
                        desde su alta, y pasa a 10%/tier solo. No hay fecha global que recordar.
                    </div>
                    {status.commission.firstMonthList.length > 0 ? (
                        <ul className="mt-3 space-y-1.5">
                            {status.commission.firstMonthList.map((m) => (
                                <li key={m.id} className="flex items-center justify-between text-sm">
                                    <span className="truncate text-slate-700">{m.name}</span>
                                    <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                                        {m.daysRemaining} días gratis
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-3 text-sm text-slate-400">Ningún comercio en mes gratis ahora mismo.</p>
                    )}
                </Card>

                {/* 2. Boost de puntos */}
                <Card
                    icon={<Zap className="h-5 w-5" />}
                    title="Boost de puntos"
                    subtitle="Se apaga solo al vencer — nada que verificar"
                    accent="amber"
                >
                    {status.boost.active ? (
                        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                            <Clock className="mb-1 inline h-4 w-4" /> Boost <strong>×{status.boost.multiplier} activo</strong> ·
                            vence en <strong>{status.boost.daysRemaining} días</strong> ({fmtDate(status.boost.until)}).
                        </div>
                    ) : (
                        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            Boost apagado (×1). Activalo el día del lanzamiento.
                        </div>
                    )}
                    <div className="mt-3">
                        {status.boost.active ? (
                            <button
                                type="button"
                                onClick={() => toggleBoost(false)}
                                disabled={busy === "boost"}
                                className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                {busy === "boost" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Apagar boost"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => toggleBoost(true)}
                                disabled={busy === "boost"}
                                className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-50"
                            >
                                {busy === "boost" ? (
                                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                ) : (
                                    "Activar boost ×2 por 30 días"
                                )}
                            </button>
                        )}
                    </div>
                </Card>

                {/* 3. Publicidad Fase 2 */}
                <Card
                    icon={<Store className="h-5 w-5" />}
                    title="Publicidad (Fase 2)"
                    subtitle="Cuando tengas comercios de sobra"
                    accent="violet"
                >
                    <div className="mb-3 flex items-center justify-between rounded-xl bg-violet-50 p-3">
                        <span className="text-sm text-violet-800">Comercios activos</span>
                        <span className="text-lg font-black text-violet-700">
                            {status.publicidad.activeMerchants}
                            <span className="text-xs font-bold text-violet-400"> / {status.publicidad.threshold}</span>
                        </span>
                    </div>
                    {!status.publicidad.thresholdReached && (
                        <p className="mb-3 text-xs text-slate-500">
                            <Info className="mb-0.5 mr-1 inline h-3.5 w-3.5" />
                            Te sugiero esperar a llegar a {status.publicidad.threshold} comercios activos antes de abrir la
                            publicidad. Igual podés activarla ahora si querés.
                        </p>
                    )}
                    {status.publicidad.exists ? (
                        <button
                            type="button"
                            onClick={() => togglePublicidad(!status.publicidad.enabled)}
                            disabled={busy === "publicidad"}
                            className={`flex w-full items-center justify-between rounded-xl border py-2.5 pl-4 pr-3 text-sm font-bold transition disabled:opacity-50 ${
                                status.publicidad.enabled
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <span>{status.publicidad.enabled ? "Publicidad activada" : "Publicidad apagada"}</span>
                            {busy === "publicidad" ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : status.publicidad.enabled ? (
                                <ToggleRight className="h-7 w-7 text-green-600" />
                            ) : (
                                <ToggleLeft className="h-7 w-7 text-slate-400" />
                            )}
                        </button>
                    ) : (
                        <p className="text-xs text-slate-400">
                            El flag <code className="rounded bg-slate-100 px-1">merchant.publicidad</code> todavía no existe. Corré{" "}
                            <code className="rounded bg-slate-100 px-1">seed-feature-flags.ts</code>.
                        </p>
                    )}
                </Card>

                {/* 4. Precio nafta */}
                <Card
                    icon={<Fuel className="h-5 w-5" />}
                    title="Precio nafta"
                    subtitle="Actualizá si cambia el surtidor"
                    accent="red"
                >
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
                        $ por litro (súper)
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="number"
                                value={fuelInput}
                                onChange={(e) => setFuelInput(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 py-2.5 pl-7 pr-3 text-sm font-bold text-slate-800 focus:border-[#e60012] focus:outline-none"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={saveFuel}
                            disabled={busy === "fuel"}
                            className="rounded-xl bg-[#e60012] px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                            {busy === "fuel" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Alimenta el costo por km del motor logístico.</p>
                </Card>
            </div>
        </div>
    );
}
