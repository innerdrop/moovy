/**
 * Sentry — configuración del Edge runtime.
 *
 * Se ejecuta en proxy.ts (middleware) y route handlers que opten
 * por `export const runtime = 'edge'`. En Moovy actualmente sólo
 * el proxy corre en Edge.
 *
 * Limitaciones del Edge runtime:
 *  - No hay `require` dinámico → import estático
 *  - APIs reducidas (no fs, no crypto.randomBytes, etc)
 *  - Workers tienen CPU/memory caps estrictos
 *
 * Por eso el scrubbing acá es más simple — sólo lo esencial.
 */

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProd = process.env.NODE_ENV === "production";

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,

        // Tracing más bajo en edge — son requests muy frecuentes (todo el tráfico
        // pasa por el middleware), no queremos llenar cuota.
        tracesSampleRate: isProd ? 0.05 : 1.0,

        environment: isProd ? "production" : "development",

        beforeSend: (event) => {
            try {
                return scrubSentryEvent(event);
            } catch {
                return null;
            }
        },

        initialScope: {
            tags: {
                app: "moovy-edge",
                runtime: "edge",
            },
        },
    });
}
