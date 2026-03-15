// Rate limiting helper for API routes
// Uses the existing checkRateLimit from security.ts
// Usage: const limited = applyRateLimit(request, "orders:create", 10, 60_000);
//        if (limited) return limited; // Returns 429 response automatically

import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security";

/**
 * Extract client IP from request headers (works behind proxies/load balancers)
 */
function getClientIp(request: Request): string {
    const headers = new Headers(request.headers);
    return (
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        "unknown"
    );
}

/**
 * Apply rate limiting to an API route.
 * Returns null if allowed, or a 429 NextResponse if rate limited.
 *
 * @param request - The incoming request
 * @param prefix - A namespace for this limiter (e.g. "orders:create", "search")
 * @param maxAttempts - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds (default 60s)
 */
export function applyRateLimit(
    request: Request,
    prefix: string,
    maxAttempts: number = 30,
    windowMs: number = 60_000
): NextResponse | null {
    const ip = getClientIp(request);
    const key = `${prefix}:${ip}`;

    const { allowed, remaining, resetIn } = checkRateLimit(key, maxAttempts, windowMs);

    if (!allowed) {
        return NextResponse.json(
            { error: "Demasiadas solicitudes. Intentá de nuevo en unos minutos." },
            {
                status: 429,
                headers: {
                    "Retry-After": String(Math.ceil(resetIn / 1000)),
                    "X-RateLimit-Limit": String(maxAttempts),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": String(Math.ceil(resetIn / 1000)),
                },
            }
        );
    }

    return null; // Allowed — continue processing
}
