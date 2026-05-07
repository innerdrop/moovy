/**
 * Sentry — configuración del server (Node runtime).
 *
 * Se ejecuta en route handlers, server actions, server components,
 * cron jobs y middleware Node-side. NO incluye Edge runtime
 * (eso va en sentry.edge.config.ts).
 *
 * PII scrubbing: idéntico al client, vía scrubSentryEvent.
 */

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProd = process.env.NODE_ENV === "production";

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,

        // Tracing — server-side queremos más datos para debug de queries lentas,
        // pero no al 100% para no consumir cuota.
        tracesSampleRate: isProd ? 0.2 : 1.0,

        environment: isProd ? "production" : "development",

        // Server-side ignoreErrors — categorías que no son accionables
        ignoreErrors: [
            // Aborts del cliente al cancelar una request mid-flight
            "AbortError",
            "ECONNRESET",
            "ECONNABORTED",
            // Errores de Prisma transitorios que se auto-recuperan
            "P1001", // Can't reach database (cubre hiccups de red)
        ],

        // Hook canónico de scrubbing — última línea de defensa
        beforeSend: (event) => {
            try {
                return scrubSentryEvent(event);
            } catch (err) {
                console.error("[Sentry server] beforeSend scrub failed, dropping event:", err);
                return null;
            }
        },

        // Hook para breadcrumbs — scrub del data antes de almacenar
        beforeBreadcrumb: (breadcrumb) => {
            try {
                if (breadcrumb.message) {
                    breadcrumb.message = require("@/lib/sentry-scrub").scrubText(breadcrumb.message);
                }
                if (breadcrumb.data) {
                    breadcrumb.data = require("@/lib/sentry-scrub").scrubObject(breadcrumb.data);
                }
                return breadcrumb;
            } catch {
                return null; // Mejor descartar breadcrumb que filtrar PII
            }
        },

        initialScope: {
            tags: {
                app: "moovy-server",
                runtime: "nodejs",
            },
        },
    });
}
