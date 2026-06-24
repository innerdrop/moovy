/**
 * Auth para endpoints API de admin/OPS.
 *
 * Reemplaza al patrón legacy `hasAnyRole(session, ["ADMIN"])` / `session.user.role
 * === "ADMIN"` que consultaba el JWT — un cache de hasta 7 días que NO refleja el
 * estado real del usuario. Este helper consulta la tabla `User` directamente
 * (source of truth), igual que `requireDriverApi`/`requireMerchantApi` y que el
 * layout protegido (`requireAdminAccess` → `computeUserAccess`).
 *
 * Contexto (auditoría C-1): si a un admin se le quita el rol (`role='USER'`) o se
 * lo suspende, su JWT sigue diciendo `role:"ADMIN"` hasta 7 días → podía seguir
 * procesando refunds, payouts, broadcasts y borrados. Al chequear la DB en cada
 * request, el degradado/suspensión tiene efecto INMEDIATO sin tocar la sesión.
 *
 * Uso típico:
 *   const admin = await requireApiAdmin();
 *   if (admin instanceof NextResponse) return admin;
 *   // admin.userId garantizado; el usuario es ADMIN activo (no suspendido/archivado)
 *   await logAudit({ ..., userId: admin.userId });
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AdminApiAuthOk = {
    userId: string;
    role: string;
    name: string | null;
    email: string | null;
};

export async function requireApiAdmin(): Promise<NextResponse | AdminApiAuthOk> {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Source of truth: la DB, NO el rol del JWT (que puede estar stale).
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            name: true,
            email: true,
            isSuspended: true,
            suspendedUntil: true,
            archivedAt: true,
        },
    });

    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Un admin archivado o suspendido (vigente) queda bloqueado de inmediato.
    if (user.archivedAt) {
        return NextResponse.json({ error: "Cuenta archivada" }, { status: 403 });
    }
    if (
        user.isSuspended &&
        (!user.suspendedUntil || user.suspendedUntil > new Date())
    ) {
        return NextResponse.json({ error: "Cuenta suspendida" }, { status: 403 });
    }

    return { userId, role: user.role, name: user.name, email: user.email };
}
