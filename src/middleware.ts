// Next.js Middleware - Subdomain-Based Portal Routing (Simplified)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type PortalType = 'client' | 'comercio' | 'conductor' | 'ops';

function getPortalFromHost(host: string | null): PortalType {
    if (!host) return 'client';
    const cleanHost = host.toLowerCase().split(':')[0];

    if (cleanHost.startsWith('comercios.')) return 'comercio';
    if (cleanHost.startsWith('conductores.')) return 'conductor';
    if (cleanHost.startsWith('ops.')) return 'ops';

    return 'client';
}

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
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const portal = getPortalFromHost(host);

    // Skip static files and API routes
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // For subdomains: redirect to the correct portal path on main domain
    // This is the simplest and most reliable approach
    if (portal === 'comercio') {
        // comercios.somosmoovy.com/* -> somosmoovy.com/comercios/*
        if (!pathname.startsWith('/comercios')) {
            const targetPath = pathname === '/' ? '/comercios/login' : `/comercios${pathname}`;
            return NextResponse.redirect(new URL(targetPath, 'https://somosmoovy.com'));
        }
    }

    if (portal === 'conductor') {
        // conductores.somosmoovy.com/* -> somosmoovy.com/conductores/*
        if (!pathname.startsWith('/conductores')) {
            const targetPath = pathname === '/' ? '/conductores/login' : `/conductores${pathname}`;
            return NextResponse.redirect(new URL(targetPath, 'https://somosmoovy.com'));
        }
    }

    if (portal === 'ops') {
        // ops.somosmoovy.com/* -> somosmoovy.com/ops/*
        if (!pathname.startsWith('/ops')) {
            const targetPath = pathname === '/' ? '/ops/login' : `/ops${pathname}`;
            return NextResponse.redirect(new URL(targetPath, 'https://somosmoovy.com'));
        }
    }

    // Protection for portal routes on main domain
    const token = await getToken({ req: request, secret: getAuthSecret() });
    const userRole = (token as any)?.role as string | undefined;

    // Protect /comercios/* routes (except login)
    if (pathname.startsWith('/comercios') && pathname !== '/comercios/login') {
        if (!token) {
            return NextResponse.redirect(new URL('/comercios/login', request.url));
        }
        if (!['MERCHANT', 'ADMIN'].includes(userRole || '')) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Protect /conductores/* routes (except login)
    if (pathname.startsWith('/conductores') && pathname !== '/conductores/login') {
        if (!token) {
            return NextResponse.redirect(new URL('/conductores/login', request.url));
        }
        if (!['DRIVER', 'ADMIN'].includes(userRole || '')) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Protect /ops/* routes (except login)
    if (pathname.startsWith('/ops') && !pathname.startsWith('/ops/login')) {
        if (!token) {
            return NextResponse.redirect(new URL('/ops/login', request.url));
        }
        if (userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Protect client paths
    const clientProtectedPaths = ['/mi-perfil', '/checkout', '/mis-pedidos'];
    if (clientProtectedPaths.some(path => pathname.startsWith(path)) && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
    ],
};
