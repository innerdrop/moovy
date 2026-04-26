// API: feed de cuentas auto-bloqueadas por intentos fallidos (ISSUE-062 visibilidad OPS).
//
// Devuelve dos listas:
//   1) currentlyLocked  — users con loginLockedUntil > now (en este momento).
//   2) recentLocks      — auditoría de USER_LOGIN_AUTO_LOCKED en últimas 24h.
//
// Sirve para que el admin OPS vea desde /ops/fraude:
//   - Quiénes están bloqueados AHORA (con botón Desbloquear inline + link al perfil).
//   - Histórico reciente para contactar proactivamente a quienes siguen sin entrar.
//
// Admin-only. Sin paginación — pico esperado <50 entradas/24h en Ushuaia.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const now = new Date();
        const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // (1) Currently locked: loginLockedUntil > now
        const currentlyLocked = await prisma.user.findMany({
            where: {
                loginLockedUntil: { gt: now },
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                failedLoginAttempts: true,
                loginLockedUntil: true,
            },
            orderBy: { loginLockedUntil: "desc" },
            take: 50,
        });

        // (2) Recent locks: AuditLog USER_LOGIN_AUTO_LOCKED en últimas 24h.
        // El AuditLog viene de auditLog() en src/lib/security.ts — está en console.log,
        // NO en la tabla AuditLog de Prisma. Por eso usamos un fallback:
        // findMany users con failedLoginAttempts > 0 y updatedAt en últimas 24h
        // (el update fue cuando se les contó el intento). No 100% preciso si el user
        // se desbloqueó manualmente, pero es la mejor señal disponible sin agregar
        // un modelo nuevo de tracking.
        const recentlyLocked = await prisma.user.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { loginLockedUntil: { gt: since24h } },
                    {
                        // tuvo lock en las últimas 24h aunque ya pasó
                        AND: [
                            { failedLoginAttempts: { gt: 0 } },
                            { updatedAt: { gt: since24h } },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                failedLoginAttempts: true,
                loginLockedUntil: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 100,
        });

        return NextResponse.json({
            currentlyLocked,
            recentlyLocked,
            stats: {
                lockedNow: currentlyLocked.length,
                lockedLast24h: recentlyLocked.length,
            },
        });
    } catch (error) {
        console.error("[auto-locked-accounts] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
