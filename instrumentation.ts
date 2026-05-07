/**
 * Next.js instrumentation hook — punto de entrada de Sentry server-side.
 *
 * Next.js llama a `register()` una vez al arrancar el servidor.
 * Importamos el config correspondiente al runtime activo.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("./sentry.server.config");
    }
    if (process.env.NEXT_RUNTIME === "edge") {
        await import("./sentry.edge.config");
    }
}

/**
 * onRequestError hook — captura errores que Next.js intercepta
 * antes de llegar a route handlers (ej: errores en RSC, en streaming).
 */
export async function onRequestError(
    err: unknown,
    request: {
        path: string;
        method: string;
        headers: Record<string, string | string[] | undefined>;
    },
    context: {
        routerKind: "Pages Router" | "App Router";
        routePath: string;
        routeType: "render" | "route" | "action" | "middleware";
        renderSource?: string;
        revalidateReason?: "on-demand" | "stale" | "isr" | undefined;
        renderType?: "dynamic" | "dynamic-resume";
    }
) {
    // Importamos dinámicamente para evitar peso en cold start
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureRequestError(err, request, context);
}
