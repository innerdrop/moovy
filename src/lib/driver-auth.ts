/**
 * Auth para endpoints API del portal driver.
 *
 * Reemplaza al patrón legacy `hasAnyRole(session, ["DRIVER"])` que consultaba
 * el JWT `roles[]` — un cache que puede estar stale respecto al estado real del
 * dominio. Este helper consulta la tabla `Driver` directamente (source of truth
 * canónico, alineado con `computeUserAccess` usado en los layouts protegidos y
 * con el fix del middleware del 2026-04-15 en `proxy.ts`).
 *
 * Contexto del bug que resuelve:
 *   Si el user activa su rol DRIVER después de haber logueado (o por cualquier
 *   drift de token), el JWT no tiene "DRIVER" en roles[] y `hasAnyRole` falla
 *   con 403 aunque en DB su Driver esté APPROVED y activo. El layout protegido
 *   pasa porque usa DB; los endpoints API fallaban porque usaban el JWT.
 *
 * Uso típico:
 *   const authResult = await requireDriverApi();
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { driver } = authResult;
 *   // acá driver está garantizado NON-null (a menos que allowAdmin y sea admin)
 *
 * Para endpoints que también aceptan ADMIN:
 *   const authResult = await requireDriverApi({ allowAdmin: true });
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { driver, isAdmin } = authResult;
 *   // driver puede ser null si isAdmin === true
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Driver } from "@prisma/client";

export type DriverApiAuthOk = {
    userId: string;
    driver: Driver | null;
    isAdmin: boolean;
};

export async function requireDriverApi(options?: {
    allowAdmin?: boolean;
}): Promise<NextResponse | DriverApiAuthOk> {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const isAdmin = (session.user as any).role === "ADMIN";

    const driver = await prisma.driver.findUnique({ where: { userId } });

    if (!driver && !(options?.allowAdmin && isAdmin)) {
        return NextResponse.json(
            { error: "No tenés cuenta activa de repartidor" },
            { status: 403 },
        );
    }

    return { userId, driver, isAdmin };
}
