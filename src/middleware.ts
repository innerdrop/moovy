// Middleware: CSRF Protection via Origin Header Validation
// Ensures all state-changing requests (POST, PUT, PATCH, DELETE) come from our own domain
import { NextRequest, NextResponse } from "next/server";

// Routes that are exempt from CSRF (webhooks from external services)
const CSRF_EXEMPT_PATHS = [
    "/api/webhooks/",       // MercadoPago webhooks
    "/api/cron/",           // Internal cron jobs (protected by CRON_SECRET)
];

// Allowed origins for the app
function getAllowedOrigins(): string[] {
    const origins: string[] = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (appUrl) {
        origins.push(new URL(appUrl).origin);
    }

    // Always allow localhost in development
    if (process.env.NODE_ENV === "development") {
        origins.push("http://localhost:3000");
        origins.push("http://127.0.0.1:3000");
    }

    // Production domain
    origins.push("https://www.somosmoovy.com");
    origins.push("https://somosmoovy.com");

    return origins;
}

function isExempt(pathname: string): boolean {
    return CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
    const { method, nextUrl } = request;
    const pathname = nextUrl.pathname;

    // Only check state-changing methods
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        return NextResponse.next();
    }

    // Only check API routes
    if (!pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    // Skip exempt paths (webhooks, crons)
    if (isExempt(pathname)) {
        return NextResponse.next();
    }

    // Get the Origin or Referer header
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    // Determine the request origin
    let requestOrigin: string | null = null;

    if (origin) {
        requestOrigin = origin;
    } else if (referer) {
        try {
            requestOrigin = new URL(referer).origin;
        } catch {
            requestOrigin = null;
        }
    }

    // If no origin header at all, this could be a server-to-server request
    // (e.g., from Socket.IO server). Allow if no origin is present.
    // Browsers ALWAYS send Origin on cross-origin requests.
    if (!requestOrigin) {
        return NextResponse.next();
    }

    // Validate origin against allowed list
    const allowed = getAllowedOrigins();
    if (!allowed.includes(requestOrigin)) {
        console.warn(
            `[CSRF] Blocked request from origin: ${requestOrigin} to ${pathname}`
        );
        return NextResponse.json(
            { error: "Origen no autorizado" },
            { status: 403 }
        );
    }

    return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
    matcher: "/api/:path*",
};
