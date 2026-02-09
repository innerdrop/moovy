/**
 * Centralized Timezone Management for Moovy Platform
 * 
 * All datetime formatting and display should use these utilities
 * to ensure consistent timezone handling across the platform.
 * 
 * Timezone: America/Argentina/Ushuaia (UTC-3)
 */

export const TIMEZONE = 'America/Argentina/Ushuaia';
export const LOCALE = 'es-AR';

/**
 * Format a date to full datetime string in Ushuaia timezone
 * Example: "08/02/2026, 19:37"
 */
export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(LOCALE, {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format a date to time-only string in Ushuaia timezone
 * Example: "19:37"
 */
export function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString(LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: TIMEZONE
    });
}

/**
 * Format a date to date-only string in Ushuaia timezone
 * Example: "08/02/2026"
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(LOCALE, {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Format a date with custom options, always using Ushuaia timezone
 */
export function formatWithOptions(
    date: Date | string,
    options: Intl.DateTimeFormatOptions
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(LOCALE, {
        ...options,
        timeZone: TIMEZONE
    });
}

/**
 * Get the current date/time as a Date object
 * Note: JavaScript Date objects are always UTC internally,
 * but formatting functions will display in Ushuaia timezone
 */
export function getNow(): Date {
    return new Date();
}

/**
 * Format relative time (e.g., "hace 5 minutos")
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays < 7) return `hace ${diffDays} días`;

    return formatDate(d);
}
