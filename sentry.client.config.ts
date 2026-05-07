/**
 * Sentry — configuración del cliente (browser).
 *
 * Se ejecuta una vez al cargar la app en el navegador del usuario.
 * Captura errores client-side, web vitals, y breadcrumbs de navegación.
 *
 * Variables de entorno:
 *  - NEXT_PUBLIC_SENTRY_DSN — DSN del proyecto (público por diseño)
 *  - NEXT_PUBLIC_APP_URL — para tagging por entorno
 *  - NODE_ENV — production / development
 *
 * PII scrubbing: todos los eventos pasan por scrubSentryEvent (ver
 * src/lib/sentry-scrub.ts) antes de enviarse. Cumple Ley 25.326 AAIP.
 */

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProd = process.env.NODE_ENV === "production";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Solo inicializar si hay DSN — evitar logs ruidosos en local sin Sentry
if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,

        // Tracing — en MVP sampleamos al 10% para no consumir cuota gratis
        tracesSampleRate: isProd ? 0.1 : 1.0,

        // Replay — desactivado en MVP. Activar cuando upgrade a paid plan.
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,

        // Environment tag — aparece en cada issue
        environment: isProd ? "production" : "development",

        // Release — Sentry lo setea automáticamente con git SHA en build
        // si SENTRY_AUTH_TOKEN está configurado.

        // Ignorar errores ruidosos que no son accionables
        ignoreErrors: [
            // Network errors — fuera de nuestro control
            "Network request failed",
            "NetworkError",
            "Failed to fetch",
            "Load failed",
            // Browser extensions
            "extension://",
            "chrome-extension://",
            "moz-extension://",
            // Service worker noise
            "ResizeObserver loop",
            "Non-Error promise rejection captured",
            // Cross-origin scripts (no actionable info)
            "Script error.",
        ],

        // Filtrar URLs que no son nuestras
        denyUrls: [
            // Browser extensions
            /extensions\//i,
            /^chrome:\/\//i,
            /^chrome-extension:\/\//i,
            /^moz-extension:\/\//i,
            // Third-party scripts
            /googletagmanager\.com/i,
            /google-analytics\.com/i,
        ],

        // Hook canónico de scrubbing — última línea de defensa
        beforeSend: (event) => {
            try {
                return scrubSentryEvent(event);
            } catch (err) {
                // Si el scrub falla, mejor descartar el evento que filtrar PII
                console.error("[Sentry] beforeSend scrub failed, dropping event:", err);
                return null;
            }
        },

        // Tags estáticos
        initialScope: {
            tags: {
                app: "moovy-web",
                appUrl,
            },
        },
    });
}
