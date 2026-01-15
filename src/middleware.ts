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
        allowedRoles: ['USER', 'ADMIN'],
        protectedPaths: ['/mi-perfil', '/checkout', '/mis-pedidos'],
        loginPath: '/login',
    },
    comercio: {
        allowedRoles: ['MERCHANT', 'ADMIN'],
        protectedPaths: ['/dashboard', '/productos', '/pedidos', '/configuracion'],
        loginPath: '/login',
    },
    conductor: {
        allowedRoles: ['DRIVER', 'ADMIN'],
        protectedPaths: ['/dashboard', '/entregas', '/historial'],
        loginPath: '/login',
    },
    ops: {
        allowedRoles: ['ADMIN'],
        protectedPaths: ['/'], // Everything is protected in ops portal
        loginPath: '/login',
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

    // Skip static files and API routes
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // Get user token
    const token = await getToken({
        req: request,
        secret: getAuthSecret()
    });

    const userRole = (token as any)?.role as string | undefined;
    const config = portalConfig[portal];

    // For ops portal, everything except login requires ADMIN
    if (portal === 'ops' && pathname !== '/login') {
        if (!token || userRole !== 'ADMIN') {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // For comercio and conductor portals, check role on protected paths
    if (portal === 'comercio' || portal === 'conductor') {
        const isProtected = pathname !== '/login' && pathname !== '/register';
        if (isProtected && token) {
            // User is logged in, check if role matches portal
            if (!config.allowedRoles.includes(userRole || '')) {
                // Redirect to main site if wrong role
                return NextResponse.redirect(new URL('https://somosmoovy.com'));
            }
        } else if (isProtected && !token) {
            // Not logged in, redirect to login
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // For client portal, only protect specific paths
    if (portal === 'client') {
        const isProtected = config.protectedPaths.some(path => pathname.startsWith(path));
        if (isProtected && !token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Rewrite URL for portal-specific routes
    // e.g., comercios.somosmoovy.com/login -> /comercios/login internally
    if (portal !== 'client') {
        const portalPaths: Record<string, string> = {
            comercio: '/comercios',
            conductor: '/conductores',
            ops: '/ops',
        };

        const basePath = portalPaths[portal];

        // Don't rewrite if already on the correct path
        if (!pathname.startsWith(basePath) && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
            const newUrl = new URL(`${basePath}${pathname}`, request.url);
            newUrl.search = request.nextUrl.search;
            return NextResponse.rewrite(newUrl);
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
