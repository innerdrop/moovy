// Next.js Proxy - Subdomain-Based Portal Routing with Auth.js v5 + CSRF Protection
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";

type PortalType = 'client' | 'comercio' | 'conductor' | 'ops';

/**
 * Builds a public-facing URL using Nginx forwarding headers.
 * In production, Nginx sends Host: somosmoovy.com and X-Forwarded-Proto: https,
 * but request.url reflects the internal connection (localhost:3002).
 * This helper ensures redirects go to the public domain, not the internal one.
 */
function publicUrl(path: string, request: NextRequest): URL {
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'somosmoovy.com';
    return new URL(path, `${proto}://${host}`);
}

function getPortalFromHost(host: string | null): PortalType {
    if (!host) return 'client';
    const cleanHost = host.toLowerCase().split(':')[0];

    if (cleanHost.startsWith('comercios.')) return 'comercio';
    if (cleanHost.startsWith('conductores.')) return 'conductor';
    if (cleanHost.startsWith('ops.')) return 'ops';

    return 'client';
}

// ─── CSRF Protection ────────────────────────────────────────────────────────
const CSRF_EXEMPT_PATHS = [
    "/api/webhooks/",       // MercadoPago webhooks
    "/api/cron/",           // Internal cron jobs (protected by CRON_SECRET)
];

function getAllowedOrigins(): string[] {
    const origins: string[] = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
        try { origins.push(new URL(appUrl).origin); } catch { /* ignore */ }
    }
    if (process.env.NODE_ENV === "development") {
        origins.push("http://localhost:3000");
        origins.push("http://127.0.0.1:3000");
    }
    origins.push("https://www.somosmoovy.com");
    origins.push("https://somosmoovy.com");
    return origins;
}

function checkCsrf(request: NextRequest): NextResponse | null {
    const { method } = request;
    const pathname = request.nextUrl.pathname;

    // Only check state-changing methods on API routes
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return null;
    if (!pathname.startsWith("/api/")) return null;
    if (CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p))) return null;

    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    let requestOrigin: string | null = null;

    if (origin) {
        requestOrigin = origin;
    } else if (referer) {
        try { requestOrigin = new URL(referer).origin; } catch { requestOrigin = null; }
    }

    // No origin = server-to-server (Socket.IO, etc.) — allow
    if (!requestOrigin) return null;

    const allowed = getAllowedOrigins();
    if (!allowed.includes(requestOrigin)) {
        console.warn(`[CSRF] Blocked request from origin: ${requestOrigin} to ${pathname}`);
        return NextResponse.json({ error: "Origen no autorizado" }, { status: 403 });
    }

    return null;
}

// ─── Main Proxy Handler ─────────────────────────────────────────────────────
export default auth(async (request) => {
    const { pathname } = request.nextUrl;

    // CSRF check — runs before everything else
    const csrfBlock = checkCsrf(request);
    if (csrfBlock) return csrfBlock;
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const portal = getPortalFromHost(host);

    // Skip static files
    if (pathname.startsWith('/_next') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // Get session from Auth.js v5
    const session = request.auth;
    const userRole = session?.user?.role as string | undefined;
    const userRoles: string[] = (session?.user as any)?.roles || (userRole ? [userRole] : []);

    // === MAINTENANCE MODE CHECK (DISABLED TEMPORARILY TO FIX TIMEOUT) ===
    /*
    const maintenanceAllowedPaths = [
        '/ops', '/mantenimiento', '/api/maintenance', '/api/auth',
    ];
    const isAllowedPath = maintenanceAllowedPaths.some(p => pathname.startsWith(p)) || portal === 'ops';
    // ...
    */
    // === END MAINTENANCE MODE CHECK ===

    // For subdomains: rewrite to correct portal path
    // CRITICAL: Exempt system paths from portal rewrites
    const isSystemPath = pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.') ||
        pathname === '/mantenimiento';

    if (!isSystemPath) {
        if (portal === 'comercio') {
            if (pathname === '/') {
                return NextResponse.rewrite(new URL('/comercios', request.url));
            }
            if (!pathname.startsWith('/comercios')) {
                return NextResponse.rewrite(new URL(`/comercios${pathname}`, request.url));
            }
        }

        if (portal === 'conductor') {
            if (pathname === '/') {
                return NextResponse.rewrite(new URL('/repartidor', request.url));
            }
            if (!pathname.startsWith('/repartidor')) {
                return NextResponse.rewrite(new URL(`/repartidor${pathname}`, request.url));
            }
        }

        if (portal === 'ops') {
            if (pathname === '/') {
                return NextResponse.rewrite(new URL('/ops', request.url));
            }
            if (!pathname.startsWith('/ops')) {
                return NextResponse.rewrite(new URL(`/ops${pathname}`, request.url));
            }
        }
    }

    // Protect /comercios/* routes (except login)
    if (pathname.startsWith('/comercios') && !pathname.startsWith('/comercios/login')) {
        if (!session) {
            return NextResponse.redirect(publicUrl('/comercios/login', request));
        }
        if (!hasAnyRole(session, ['MERCHANT', 'COMERCIO', 'ADMIN'])) {
            return NextResponse.redirect(publicUrl('/', request));
        }
    }

    // Protect /repartidor/* routes (except login and registro)
    // FIX 2026-04-15: El chequeo de rol DRIVER fue removido del middleware porque el JWT
    // `roles[]` puede estar desincronizado con el estado real del dominio (el user se activ\u00f3
    // como driver despu\u00e9s del login y el JWT todav\u00eda no se refresc\u00f3). El layout
    // `/repartidor/(protected)` ya usa `requireDriverAccess()` que consulta DB via
    // `computeUserAccess()` — source of truth canónico — y redirige al lugar correcto
    // (registro, pendiente, login, home) seg\u00fan el estado real del Driver.
    // Mantener solo la validaci\u00f3n de sesi\u00f3n existente.
    if (pathname.startsWith('/repartidor') && !pathname.startsWith('/repartidor/login') && !pathname.startsWith('/repartidor/registro')) {
        if (!session) {
            return NextResponse.redirect(publicUrl('/repartidor/login', request));
        }
    }

    // Protect /ops/* routes (except login)
    if (pathname.startsWith('/ops') && !pathname.startsWith('/ops/login')) {
        if (!session) {
            return NextResponse.redirect(publicUrl('/ops/login', request));
        }
        if (!hasAnyRole(session, ['ADMIN'])) {
            return NextResponse.redirect(publicUrl('/ops/login?error=Unauthorized', request));
        }
    }

    // Protect client paths
    const clientProtectedPaths = ['/mi-perfil', '/checkout', '/mis-pedidos'];
    if (clientProtectedPaths.some(path => pathname.startsWith(path)) && !session) {
        return NextResponse.redirect(publicUrl('/login', request));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
    ],
};
