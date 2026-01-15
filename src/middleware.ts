// Next.js Middleware - Subdomain-Based Portal Routing
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Portal detection based on subdomain
type PortalType = 'client' | 'comercio' | 'conductor' | 'ops';

function getPortalFromHost(host: string | null): PortalType {
    if (!host) return 'client';
    const cleanHost = host.toLowerCase().split(':')[0];

    if (cleanHost.startsWith('comercios.')) return 'comercio';
    if (cleanHost.startsWith('conductores.')) return 'conductor';
    if (cleanHost.startsWith('ops.')) return 'ops';

    return 'client';
}

// Portal configuration
const portalConfig = {
    client: {
        basePath: '',
        allowedRoles: ['USER', 'ADMIN'],
        protectedPaths: ['/mi-perfil', '/checkout', '/mis-pedidos'],
    },
    comercio: {
        basePath: '/comercios',
        allowedRoles: ['MERCHANT', 'ADMIN'],
        protectedPaths: ['/dashboard', '/productos', '/pedidos', '/configuracion', '/'],
    },
    conductor: {
        basePath: '/conductores',
        allowedRoles: ['DRIVER', 'ADMIN'],
        protectedPaths: ['/dashboard', '/entregas', '/historial', '/'],
    },
    ops: {
        basePath: '/ops',
        allowedRoles: ['ADMIN'],
        protectedPaths: ['/'], // Everything except login is protected
    },
};

function getAuthSecret(): string {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === "development") {
        return "Moovy-san-juan-dev-secret-2024-minimum-32-chars";
    }
    throw new Error("AUTH_SECRET must be set in production");
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host');
    const portal = getPortalFromHost(host);
    const config = portalConfig[portal];

    // Skip static files and API routes
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // FIRST: Rewrite URL for portal-specific routes (comercios, conductores, ops)
    // e.g., comercios.somosmoovy.com/ -> internally serve /comercios/
    // e.g., comercios.somosmoovy.com/login -> internally serve /comercios/login
    if (portal !== 'client') {
        const basePath = config.basePath;

        // Don't rewrite if already on the correct path (prevents infinite loop)
        if (!pathname.startsWith(basePath)) {
            // Construct the rewritten URL
            const rewritePath = pathname === '/' ? `${basePath}/dashboard` : `${basePath}${pathname}`;
            const newUrl = new URL(rewritePath, request.url);
            newUrl.search = request.nextUrl.search;

            // Get token to check auth for protected paths
            const token = await getToken({ req: request, secret: getAuthSecret() });
            const userRole = (token as any)?.role as string | undefined;

            // Check if this is a login page (don't protect login pages)
            const isLoginPage = pathname === '/login' || pathname === '/register';

            if (!isLoginPage) {
                // Check authentication for protected portal routes
                if (!token) {
                    // Not logged in - redirect to portal's login page
                    const loginUrl = new URL(`${basePath}/login`, request.url);
                    loginUrl.searchParams.set('callbackUrl', pathname);
                    return NextResponse.redirect(loginUrl);
                }

                // Check role authorization
                if (!config.allowedRoles.includes(userRole || '')) {
                    // Wrong role - redirect to main site
                    return NextResponse.redirect(new URL('https://somosmoovy.com'));
                }
            }

            // Rewrite to the portal-specific path
            return NextResponse.rewrite(newUrl);
        }
    }

    // For client portal (somosmoovy.com), only protect specific paths
    if (portal === 'client') {
        const isProtected = config.protectedPaths.some(path => pathname.startsWith(path));
        if (isProtected) {
            const token = await getToken({ req: request, secret: getAuthSecret() });
            if (!token) {
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('callbackUrl', pathname);
                return NextResponse.redirect(loginUrl);
            }
        }
    }

    // Add portal info to headers for use in components
    const response = NextResponse.next();
    response.headers.set('x-portal', portal);

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
    ],
};
