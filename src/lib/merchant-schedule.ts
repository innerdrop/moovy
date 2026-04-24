/**
 * Merchant Schedule Utilities — MOOVY
 *
 * Funciones centralizadas para determinar si un merchant está abierto
 * basándose en su horario configurado (o default) + pausa manual.
 *
 * REGLA DE NEGOCIO: Un merchant puede recibir pedidos SOLO si:
 *   1. No está pausado manualmente (isOpen === true)
 *   2. La hora actual está dentro de su horario de operación
 *
 * Si el merchant no configuró horario (scheduleJson === null), se aplica
 * un horario default razonable para Ushuaia.
 *
 * TIMEZONE: Todas las comparaciones horarias usan America/Argentina/Ushuaia
 * (UTC-3) via Intl.DateTimeFormat, independientemente de la timezone del
 * servidor. Esto es CRÍTICO porque el VPS corre en UTC y los horarios de
 * los merchants están en hora local de Ushuaia.
 *
 * Última actualización: 2026-04-13
 */

// ── Tipos ────────────────────────────────────────────────────────────

export interface TimeRange {
    open: string; // "HH:MM"
    close: string; // "HH:MM"
}

/** Horario semanal: días 1-7 (lunes-domingo), null = cerrado ese día */
export type WeekSchedule = Record<string, TimeRange[] | null>;

export interface ScheduleCheckResult {
    isWithinSchedule: boolean;
    isPaused: boolean;
    /** true si el merchant puede recibir pedidos ahora mismo */
    isCurrentlyOpen: boolean;
    /** Si está cerrado, próximo horario de apertura (ej: "09:00") */
    nextOpenTime: string | null;
    /** Si está cerrado, día de apertura (ej: "Lunes") */
    nextOpenDay: string | null;
    /** Horario del día actual (null si no opera hoy) */
    todaySchedule: TimeRange[] | null;
    /** Si el merchant usa el horario default (no configuró el suyo) */
    isUsingDefault: boolean;
}

// ── Constantes ───────────────────────────────────────────────────────

/**
 * Horario default para merchants sin schedule configurado.
 *
 * DECISIÓN 2026-04-24 (rama fix/merchant-onboarding-polish): todos los días
 * arrancan CERRADOS. Sin un schedule explícito, el merchant no puede operar.
 * Evita que comercios "se abran solos" por asumir un horario genérico —
 * cada comercio TIENE que configurar sus horarios antes de recibir pedidos.
 *
 * Impacto: cualquier merchant aprobado que NO tenga scheduleJson va a quedar
 * cerrado al deploy. El onboarding checklist lo marca como requisito obligatorio
 * y el dashboard del merchant redirige a mi-comercio si detecta schedule vacío.
 */
export const DEFAULT_MERCHANT_SCHEDULE: WeekSchedule = {
    "1": null, // Lunes — cerrado hasta que el merchant lo configure
    "2": null, // Martes
    "3": null, // Miércoles
    "4": null, // Jueves
    "5": null, // Viernes
    "6": null, // Sábado
    "7": null, // Domingo
};

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** Timezone canónica de Ushuaia — SIEMPRE usar esta para comparaciones horarias */
const USHUAIA_TZ = "America/Argentina/Ushuaia";

// ── Funciones ────────────────────────────────────────────────────────

/**
 * Obtiene la hora, minutos y día de la semana en timezone de Ushuaia.
 * Usa Intl.DateTimeFormat para que funcione correctamente independientemente
 * de la timezone del servidor (UTC en VPS, local en dev).
 *
 * Retorna { hours, minutes, jsDayOfWeek } donde jsDayOfWeek es 0=domingo
 * (misma convención que Date.getDay()).
 */
function getUshuaiaTime(date: Date): { hours: number; minutes: number; jsDayOfWeek: number } {
    // Intl.DateTimeFormat con hourCycle h23 nos da la hora en 0-23
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: USHUAIA_TZ,
        hour: "numeric",
        minute: "numeric",
        weekday: "short",
        hourCycle: "h23",
    });

    const parts = formatter.formatToParts(date);
    let hours = 0;
    let minutes = 0;
    let weekday = "";

    for (const part of parts) {
        if (part.type === "hour") hours = parseInt(part.value, 10);
        if (part.type === "minute") minutes = parseInt(part.value, 10);
        if (part.type === "weekday") weekday = part.value;
    }

    // Mapear weekday corto en inglés a número JS (0=dom, 1=lun, etc.)
    const weekdayMap: Record<string, number> = {
        "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6,
    };
    const jsDayOfWeek = weekdayMap[weekday] ?? date.getDay();

    return { hours, minutes, jsDayOfWeek };
}

/**
 * Convierte day de JS (0=domingo) a key de schedule (1=lunes, 7=domingo).
 * Acepta tanto un Date (extrae el día en timezone Ushuaia) como un número
 * directo de jsDayOfWeek.
 */
function jsDateToScheduleDay(dateOrJsDay: Date | number): string {
    const jsDay = typeof dateOrJsDay === "number"
        ? dateOrJsDay
        : getUshuaiaTime(dateOrJsDay).jsDayOfWeek;
    return jsDay === 0 ? "7" : String(jsDay);
}

/**
 * Convierte key de schedule (1-7) a nombre de día
 */
function scheduleDayToName(scheduleDay: string): string {
    const map: Record<string, string> = {
        "1": "Lunes", "2": "Martes", "3": "Miércoles",
        "4": "Jueves", "5": "Viernes", "6": "Sábado", "7": "Domingo",
    };
    return map[scheduleDay] || "";
}

/**
 * Parsea un scheduleJson string a WeekSchedule.
 * Soporta formato legacy (objeto {open, close}) y nuevo (array [{open, close}]).
 */
export function parseSchedule(scheduleJson: string | null): WeekSchedule | null {
    if (!scheduleJson) return null;
    try {
        const raw = JSON.parse(scheduleJson);
        const normalized: WeekSchedule = {};
        for (const day of ["1", "2", "3", "4", "5", "6", "7"]) {
            const val = raw[day];
            if (!val) {
                normalized[day] = null;
            } else if (Array.isArray(val)) {
                normalized[day] = val;
            } else if (typeof val === "object" && val.open && val.close) {
                // Formato legacy: {open, close} → [{open, close}]
                normalized[day] = [{ open: val.open, close: val.close }];
            } else {
                normalized[day] = null;
            }
        }
        return normalized;
    } catch {
        return null;
    }
}

/**
 * Verifica si un momento (minutos desde medianoche) cae dentro de algún rango.
 */
function isTimeInRanges(currentMinutes: number, ranges: TimeRange[]): boolean {
    return ranges.some((range) => {
        const [openH, openM] = range.open.split(":").map(Number);
        const [closeH, closeM] = range.close.split(":").map(Number);
        const openMin = openH * 60 + (openM || 0);
        const closeMin = closeH * 60 + (closeM || 0);
        return currentMinutes >= openMin && currentMinutes < closeMin;
    });
}

/**
 * Busca el próximo horario de apertura a partir de ahora.
 * Recorre el día actual (si queda un turno después) y luego los próximos 7 días.
 */
function findNextOpenTime(
    schedule: WeekSchedule,
    now: Date
): { time: string; dayName: string } | null {
    const ushuaiaTime = getUshuaiaTime(now);
    const currentMinutes = ushuaiaTime.hours * 60 + ushuaiaTime.minutes;
    const todayKey = jsDateToScheduleDay(ushuaiaTime.jsDayOfWeek);

    // Primero: ¿hay un turno más tarde hoy?
    const todayRanges = schedule[todayKey];
    if (todayRanges) {
        for (const range of todayRanges) {
            const [openH, openM] = range.open.split(":").map(Number);
            const openMin = openH * 60 + (openM || 0);
            if (openMin > currentMinutes) {
                return { time: range.open, dayName: "Hoy" };
            }
        }
    }

    // Buscar en los próximos 7 días
    // Usamos offset sobre el día de Ushuaia, no sobre el Date del servidor
    for (let offset = 1; offset <= 7; offset++) {
        const futureJsDay = (ushuaiaTime.jsDayOfWeek + offset) % 7;
        const dayKey = jsDateToScheduleDay(futureJsDay);
        const ranges = schedule[dayKey];
        if (ranges && ranges.length > 0) {
            const dayName = offset === 1 ? "Mañana" : scheduleDayToName(dayKey);
            return { time: ranges[0].open, dayName };
        }
    }

    return null;
}

/**
 * Función principal: determina si un merchant está actualmente abierto.
 *
 * Combina pausa manual (isOpen) + validación horaria.
 * Si no tiene scheduleJson, usa DEFAULT_MERCHANT_SCHEDULE.
 */
export function checkMerchantSchedule(merchant: {
    isOpen: boolean;
    scheduleJson?: string | null;
    scheduleEnabled?: boolean;
}, now?: Date): ScheduleCheckResult {
    const currentTime = now || new Date();
    const isPaused = !merchant.isOpen;

    // Determinar el schedule a usar
    const parsedSchedule = parseSchedule(merchant.scheduleJson ?? null);
    const isUsingDefault = !parsedSchedule;
    const schedule = parsedSchedule || DEFAULT_MERCHANT_SCHEDULE;

    // Obtener hora actual en timezone de Ushuaia (NO del servidor)
    const ushuaiaTime = getUshuaiaTime(currentTime);

    // Obtener horario de hoy según día en Ushuaia
    const todayKey = jsDateToScheduleDay(ushuaiaTime.jsDayOfWeek);
    const todaySchedule = schedule[todayKey] || null;

    // Verificar si estamos dentro del horario (usando hora de Ushuaia)
    let isWithinSchedule = false;
    if (todaySchedule) {
        const currentMinutes = ushuaiaTime.hours * 60 + ushuaiaTime.minutes;
        isWithinSchedule = isTimeInRanges(currentMinutes, todaySchedule);
    }

    // Buscar próximo horario de apertura si está cerrado
    let nextOpenTime: string | null = null;
    let nextOpenDay: string | null = null;
    if (!isWithinSchedule) {
        const next = findNextOpenTime(schedule, currentTime);
        if (next) {
            nextOpenTime = next.time;
            nextOpenDay = next.dayName;
        }
    }

    return {
        isWithinSchedule,
        isPaused,
        isCurrentlyOpen: !isPaused && isWithinSchedule,
        nextOpenTime,
        nextOpenDay,
        todaySchedule,
        isUsingDefault,
    };
}

/**
 * Versión simplificada para uso en validación de pedidos.
 * Retorna { allowed: true } o { allowed: false, reason: string }.
 */
export function validateMerchantCanReceiveOrders(merchant: {
    isOpen: boolean;
    scheduleJson?: string | null;
    scheduleEnabled?: boolean;
    businessName?: string | null;
    name?: string;
}): { allowed: true } | { allowed: false; reason: string } {
    const merchantName = merchant.businessName || merchant.name || "El comercio";
    const result = checkMerchantSchedule(merchant);

    if (result.isPaused) {
        return {
            allowed: false,
            reason: `${merchantName} está cerrado en este momento`,
        };
    }

    if (!result.isWithinSchedule) {
        if (result.todaySchedule) {
            // Tiene horario hoy pero estamos fuera
            const ranges = result.todaySchedule.map((r) => `${r.open}-${r.close}`).join(", ");
            return {
                allowed: false,
                reason: `${merchantName} está fuera de horario (${ranges})`,
            };
        }
        // No opera hoy
        const nextInfo = result.nextOpenTime && result.nextOpenDay
            ? `. Abre ${result.nextOpenDay} a las ${result.nextOpenTime}`
            : "";
        return {
            allowed: false,
            reason: `${merchantName} no opera hoy${nextInfo}`,
        };
    }

    return { allowed: true };
}
