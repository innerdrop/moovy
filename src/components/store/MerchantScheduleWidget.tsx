// MerchantScheduleWidget
// Muestra al buyer el estado actual del comercio (abierto/cerrado) y el horario
// completo de la semana en un acordeón expandible. Server Component puro —
// usa <details>/<summary> HTML nativo para el expand/collapse, sin JS al cliente.
// Importante: el cálculo de "está abierto ahora" lo hace server-side en timezone
// de Ushuaia (ver src/lib/merchant-schedule.ts), así nunca muestra datos stale
// por un reloj desincronizado del navegador.

import { Clock, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import {
    checkMerchantSchedule,
    parseSchedule,
    DEFAULT_MERCHANT_SCHEDULE,
} from "@/lib/merchant-schedule";

interface MerchantScheduleWidgetProps {
    isOpen: boolean;
    scheduleJson: string | null;
}

const DAY_LABELS: Record<string, string> = {
    "1": "Lunes",
    "2": "Martes",
    "3": "Miércoles",
    "4": "Jueves",
    "5": "Viernes",
    "6": "Sábado",
    "7": "Domingo",
};

const DAY_ORDER = ["1", "2", "3", "4", "5", "6", "7"] as const;

// Mapea día JS (0=domingo) → key de schedule (1=lunes, 7=domingo). Replicado
// acá para marcar el día actual en el acordeón sin exponer la función interna.
function todayKeyUshuaia(): string {
    const weekdayShort = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Argentina/Ushuaia",
        weekday: "short",
    }).format(new Date());
    const map: Record<string, string> = {
        Sun: "7",
        Mon: "1",
        Tue: "2",
        Wed: "3",
        Thu: "4",
        Fri: "5",
        Sat: "6",
    };
    return map[weekdayShort] ?? "1";
}

export default function MerchantScheduleWidget({
    isOpen,
    scheduleJson,
}: MerchantScheduleWidgetProps) {
    const result = checkMerchantSchedule({ isOpen, scheduleJson });
    const parsed = parseSchedule(scheduleJson) ?? DEFAULT_MERCHANT_SCHEDULE;
    const todayKey = todayKeyUshuaia();

    // Texto del status para mostrar en el summary. Priorizamos claridad sobre
    // tecnicismos — el buyer no necesita saber si está "pausado" vs "fuera de
    // horario"; le interesa si puede pedir ahora y cuándo va a poder.
    let statusLabel: string;
    let statusDetail: string | null = null;

    if (result.isCurrentlyOpen) {
        // Encontrar la hora de cierre del turno actual para mostrar "Abierto hasta XX:XX"
        const todayRanges = result.todaySchedule;
        if (todayRanges && todayRanges.length > 0) {
            const current = todayRanges.find((r) => {
                const fmt = new Intl.DateTimeFormat("en-US", {
                    timeZone: "America/Argentina/Ushuaia",
                    hour: "numeric",
                    minute: "numeric",
                    hourCycle: "h23",
                });
                const parts = fmt.formatToParts(new Date());
                const hours = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
                const minutes = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
                const nowMin = hours * 60 + minutes;
                const [oh, om] = r.open.split(":").map(Number);
                const [ch, cm] = r.close.split(":").map(Number);
                const openMin = oh * 60 + (om || 0);
                const closeMin = ch * 60 + (cm || 0);
                return nowMin >= openMin && nowMin < closeMin;
            });
            if (current) {
                statusLabel = "Abierto";
                statusDetail = `hasta las ${current.close}`;
            } else {
                statusLabel = "Abierto";
            }
        } else {
            statusLabel = "Abierto";
        }
    } else if (result.isPaused) {
        statusLabel = "Cerrado temporalmente";
        statusDetail = "No recibe pedidos en este momento";
    } else if (result.nextOpenTime && result.nextOpenDay) {
        const dayLabel = result.nextOpenDay === "Hoy" ? "hoy" : result.nextOpenDay;
        statusLabel = "Cerrado";
        statusDetail = `Abre ${dayLabel} a las ${result.nextOpenTime}`;
    } else {
        statusLabel = "Cerrado";
    }

    return (
        <details className="group rounded-xl border border-gray-100 bg-white overflow-hidden">
            <summary
                className="flex items-center gap-3 p-4 cursor-pointer list-none select-none hover:bg-gray-50 transition"
                aria-label="Ver horarios de atención"
            >
                {result.isCurrentlyOpen ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden />
                ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" aria-hidden />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className={`text-sm font-bold ${
                                result.isCurrentlyOpen ? "text-green-700" : "text-gray-700"
                            }`}
                        >
                            {statusLabel}
                        </span>
                        {statusDetail && (
                            <span className="text-sm text-gray-500">{statusDetail}</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Ver horario de la semana
                    </p>
                </div>
                <ChevronDown
                    className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                />
            </summary>

            <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 space-y-1.5">
                {DAY_ORDER.map((day) => {
                    const ranges = parsed[day];
                    const isToday = day === todayKey;
                    return (
                        <div
                            key={day}
                            className={`flex items-center justify-between text-sm py-1 ${
                                isToday ? "font-semibold text-gray-900" : "text-gray-600"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                {DAY_LABELS[day]}
                                {isToday && (
                                    <span className="text-[10px] bg-[#e60012] text-white font-bold px-1.5 py-0.5 rounded-full uppercase">
                                        Hoy
                                    </span>
                                )}
                            </span>
                            <span className={ranges && ranges.length > 0 ? "" : "text-gray-400 italic"}>
                                {ranges && ranges.length > 0
                                    ? ranges.map((r) => `${r.open} – ${r.close}`).join(", ")
                                    : "Cerrado"}
                            </span>
                        </div>
                    );
                })}
                {result.isUsingDefault && (
                    <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100 mt-2">
                        <Clock className="w-3 h-3 inline mr-1" aria-hidden />
                        Horario estándar — el comercio aún no personalizó sus horas de atención.
                    </p>
                )}
            </div>
        </details>
    );
}
