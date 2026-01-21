// Next.js Middleware - Subdomain-Based Portal Routing with Auth.js v5
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

type PortalType = 'client' | 'comercio' | 'conductor' | 'ops';

function getPortalFromHost(host: string | null): PortalType {
    if (!host) return 'client';
    const cleanHost = host.toLowerCase().split(':')[0];

    if (cleanHost.startsWith('comercios.')) return 'comercio';
    if (cleanHost.startsWith('conductores.')) return 'conductor';
    if (cleanHost.startsWith('ops.')) return 'ops';

    return 'client';
}

export default auth((request) => {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const portal = getPortalFromHost(host);

    // Skip static files
    if (pathname.startsWith('/_next') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // Get session from Auth.js v5
    const session = request.auth;
    const userRole = session?.user?.role as string | undefined;

    // For subdomains: rewrite to correct portal path
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
            return NextResponse.rewrite(new URL('/conductores', request.url));
        }
        if (!pathname.startsWith('/conductores')) {
            return NextResponse.rewrite(new URL(`/conductores${pathname}`, request.url));
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

    // Protect /comercios/* routes (except login)
    if (pathname.startsWith('/comercios') && !pathname.startsWith('/comercios/login')) {
        if (!session) {
            return NextResponse.redirect(new URL('/comercios/login', request.url));
        }
        if (!['MERCHANT', 'ADMIN'].includes(userRole || '')) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Protect /conductores/* routes (except login)
    if (pathname.startsWith('/conductores') && !pathname.startsWith('/conductores/login')) {
        if (!session) {
            return NextResponse.redirect(new URL('/conductores/login', request.url));
        }
        if (!['DRIVER', 'ADMIN'].includes(userRole || '')) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Protect /ops/* routes (except login)
    if (pathname.startsWith('/ops') && !pathname.startsWith('/ops/login')) {
        if (!session) {
            return NextResponse.redirect(new URL('/ops/login', request.url));
        }
        if (userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/ops/login?error=Unauthorized', request.url));
        }
    }

    // Protect client paths
    const clientProtectedPaths = ['/mi-perfil', '/checkout', '/mis-pedidos'];
    if (clientProtectedPaths.some(path => pathname.startsWith(path)) && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // STRICT PORTAL SEPARATION
    if (session) {
        if (userRole === 'MERCHANT' && !pathname.startsWith('/comercios') && pathname !== '/logout') {
            return NextResponse.redirect(new URL('/comercios', request.url));
        }
        if (userRole === 'DRIVER' && !pathname.startsWith('/conductores') && pathname !== '/logout') {
            return NextResponse.redirect(new URL('/conductores', request.url));
        }
        if (userRole === 'ADMIN' && !pathname.startsWith('/ops') && pathname !== '/logout') {
            return NextResponse.redirect(new URL('/ops', request.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
    ],
};
