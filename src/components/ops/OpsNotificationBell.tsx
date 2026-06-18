"use client";

// Campana de notificaciones de OPS (feat/ops-campana-notificaciones, 2026-06-17).
//
// Muestra un boton-campana con un badge de "nuevos" y un dropdown agrupado con
// deep-links a la pantalla que resuelve cada pendiente. Los datos vienen de
// /api/admin/notifications (derivados, sin schema). Polling 45s con pausa
// cuando la pestana no esta visible (mismo espiritu que el badge de pendientes).
//
// "Nuevo desde la ultima vez": guardamos en localStorage los IDs ya vistos.
// El badge cuenta solo los no-vistos; al abrir el panel, marcamos lo visible
// como visto y el badge se limpia. Sin estado en DB (decision: derivar al vuelo).

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
    Bell,
    Store,
    Truck,
    FileText,
    Star,
    ShieldAlert,
    Check,
} from "lucide-react";

type OpsNotificationType =
    | "PENDING_MERCHANT"
    | "PENDING_DRIVER"
    | "CHANGE_REQUEST_MERCHANT"
    | "CHANGE_REQUEST_DRIVER"
    | "REVIEW_MODERATION"
    | "PIN_ISSUE";

interface OpsNotificationItem {
    id: string;
    type: OpsNotificationType;
    title: string;
    description: string;
    href: string;
    createdAt: string;
    severity: "info" | "warning" | "critical";
}

interface ApiResponse {
    items: OpsNotificationItem[];
    total: number;
    groups?: Record<string, number>;
    generatedAt: string;
}

const SEEN_KEY = "moovy-ops-notifs-seen";
const SEEN_CAP = 200; // no dejamos crecer la lista de vistos sin límite
const POLL_MS = 45000;

// Metadata visual por tipo (icono + etiqueta de grupo).
const TYPE_META: Record<OpsNotificationType, { icon: any; group: string }> = {
    PENDING_MERCHANT: { icon: Store, group: "Aprobaciones" },
    PENDING_DRIVER: { icon: Truck, group: "Aprobaciones" },
    CHANGE_REQUEST_MERCHANT: { icon: FileText, group: "Cambios de documentos" },
    CHANGE_REQUEST_DRIVER: { icon: FileText, group: "Cambios de documentos" },
    REVIEW_MODERATION: { icon: Star, group: "Reseñas" },
    PIN_ISSUE: { icon: ShieldAlert, group: "Incidentes" },
};

// Orden en que mostramos los grupos (incidentes primero por criticidad).
const GROUP_ORDER = ["Incidentes", "Aprobaciones", "Cambios de documentos", "Reseñas"];

function loadSeen(): Set<string> {
    try {
        const raw = localStorage.getItem(SEEN_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch {
        return new Set();
    }
}

function saveSeen(set: Set<string>) {
    try {
        // Capamos a los últimos SEEN_CAP para no crecer indefinidamente.
        const arr = Array.from(set).slice(-SEEN_CAP);
        localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
    } catch {
        // localStorage no disponible (incógnito estricto): la campana sigue
        // funcionando, solo que el "visto" no persiste entre recargas.
    }
}

function relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diff = Date.now() - then;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "recién";
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    return `hace ${d} d`;
}

interface OpsNotificationBellProps {
    // Hacia dónde se abre el panel. En el sidebar desktop la campana está a la
    // izquierda de la pantalla, así que el panel debe abrir hacia la DERECHA
    // (align="left" = borde izquierdo del panel pegado a la campana). En la
    // barra mobile la campana está a la derecha, así que abre hacia la izquierda
    // (align="right", default).
    align?: "left" | "right";
}

export default function OpsNotificationBell({ align = "right" }: OpsNotificationBellProps) {
    const [items, setItems] = useState<OpsNotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(false);
    // Set de IDs ya vistos (persistido). Se carga en el primer render del cliente.
    const seenRef = useRef<Set<string>>(new Set());
    const [unseenCount, setUnseenCount] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const recomputeUnseen = useCallback((list: OpsNotificationItem[]) => {
        const seen = seenRef.current;
        setUnseenCount(list.filter((i) => !seen.has(i.id)).length);
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/notifications");
            if (!res.ok) {
                // 403 u otro: tratamos como vacío, sin romper el render.
                setError(true);
                setItems([]);
                setUnseenCount(0);
                return;
            }
            const data: ApiResponse = await res.json();
            const list = Array.isArray(data.items) ? data.items : [];
            setError(false);
            setItems(list);
            recomputeUnseen(list);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [recomputeUnseen]);

    // Cargar "vistos" del localStorage al montar (solo cliente).
    useEffect(() => {
        seenRef.current = loadSeen();
    }, []);

    // Polling con pausa cuando la pestaña no está visible.
    useEffect(() => {
        fetchNotifications();
        let interval: ReturnType<typeof setInterval> | null = null;

        const start = () => {
            if (interval) return;
            interval = setInterval(fetchNotifications, POLL_MS);
        };
        const stop = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        const onVisibility = () => {
            if (document.hidden) {
                stop();
            } else {
                fetchNotifications();
                start();
            }
        };

        start();
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            stop();
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [fetchNotifications]);

    // Cerrar al clickear afuera o con Escape.
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    // Al abrir: marcar lo visible como visto (limpia el badge) pero recordando
    // cuáles eran nuevos para resaltarlos mientras el panel esté abierto.
    const newlySeenRef = useRef<Set<string>>(new Set());
    const handleToggle = () => {
        const next = !open;
        setOpen(next);
        if (next) {
            const seen = seenRef.current;
            const nuevos = new Set(items.filter((i) => !seen.has(i.id)).map((i) => i.id));
            newlySeenRef.current = nuevos;
            items.forEach((i) => seen.add(i.id));
            saveSeen(seen);
            setUnseenCount(0);
        }
    };

    const badge = unseenCount > 99 ? "99+" : String(unseenCount);

    // Agrupar items para el panel.
    const grouped: Record<string, OpsNotificationItem[]> = {};
    for (const it of items) {
        const g = TYPE_META[it.type]?.group || "Otros";
        (grouped[g] ||= []).push(it);
    }
    const groupKeys = Object.keys(grouped).sort(
        (a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b)
    );

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                aria-label={`Notificaciones${unseenCount > 0 ? ` (${unseenCount} nuevas)` : ""}`}
                aria-haspopup="true"
                aria-expanded={open}
            >
                <Bell className="w-5 h-5" />
                {unseenCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#e60012] text-white text-[10px] font-bold leading-none">
                        {badge}
                    </span>
                )}
            </button>

            {open && (
                <div className={`absolute ${align === "left" ? "left-0" : "right-0"} mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-[60] overflow-hidden`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <p className="font-semibold text-sm text-slate-900">Notificaciones</p>
                        <span className="text-xs text-slate-400">
                            {items.length > 0 ? `${items.length} pendiente${items.length === 1 ? "" : "s"}` : ""}
                        </span>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-8 text-center text-sm text-slate-400">
                                Cargando…
                            </div>
                        ) : error ? (
                            <div className="px-4 py-8 text-center text-sm text-slate-500">
                                No se pudieron cargar las notificaciones.
                                <button
                                    onClick={() => { setLoading(true); fetchNotifications(); }}
                                    className="block mx-auto mt-2 text-[#e60012] font-medium hover:underline"
                                >
                                    Reintentar
                                </button>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <Check className="w-8 h-8 mx-auto text-green-500 mb-2" />
                                <p className="text-sm font-medium text-slate-700">Sin novedades</p>
                                <p className="text-xs text-slate-400 mt-0.5">No hay pendientes por revisar.</p>
                            </div>
                        ) : (
                            groupKeys.map((g) => (
                                <div key={g}>
                                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        {g}
                                    </p>
                                    <ul>
                                        {grouped[g].map((it) => {
                                            const Icon = TYPE_META[it.type]?.icon || Bell;
                                            const esNuevo = newlySeenRef.current.has(it.id);
                                            const dot =
                                                it.severity === "critical"
                                                    ? "bg-[#e60012]"
                                                    : it.severity === "warning"
                                                        ? "bg-yellow-400"
                                                        : "bg-slate-300";
                                            return (
                                                <li key={it.id}>
                                                    <Link
                                                        href={it.href}
                                                        onClick={() => setOpen(false)}
                                                        className={`flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 transition ${esNuevo ? "bg-red-50/60" : ""}`}
                                                    >
                                                        <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                                            <Icon className="w-4 h-4 text-slate-600" />
                                                        </span>
                                                        <span className="flex-1 min-w-0">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                                                                <span className="text-[13px] font-medium text-slate-900 truncate">
                                                                    {it.title}
                                                                </span>
                                                            </span>
                                                            <span className="block text-xs text-slate-500 truncate">
                                                                {it.description}
                                                            </span>
                                                            <span className="block text-[10px] text-slate-400 mt-0.5">
                                                                {relativeTime(it.createdAt)}
                                                            </span>
                                                        </span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
