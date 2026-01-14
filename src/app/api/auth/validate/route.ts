// API Route: Validate Session and Auth Secret Strength
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Check auth configuration on startup
function validateAuthConfig() {
    const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

    const issues: string[] = [];

    if (!authSecret) {
        issues.push("AUTH_SECRET no está configurado");
    } else if (authSecret.length < 32) {
        issues.push("AUTH_SECRET debe tener al menos 32 caracteres");
    } else if (authSecret === "Moovy-san-juan-fallback-secret-2024") {
        issues.push("AUTH_SECRET está usando el valor por defecto - CAMBIAR EN PRODUCCIÓN");
    }

    if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === "production") {
        issues.push("NEXTAUTH_URL no está configurado para producción");
    }

    return issues;
}

export async function GET() {
    try {
        const session = await auth();
        const issues = validateAuthConfig();

        // Only show config issues to admins
        const isAdmin = (session?.user as any)?.role === "ADMIN";

        return NextResponse.json({
            authenticated: !!session,
            user: session ? {
                name: session.user?.name,
                email: session.user?.email,
                role: (session.user as any)?.role,
            } : null,
            configIssues: isAdmin ? issues : undefined,
            securityStatus: issues.length === 0 ? "OK" : "WARNING",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Error de autenticación" },
            { status: 500 }
        );
    }
}

