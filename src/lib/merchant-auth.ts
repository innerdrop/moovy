/**
 * Auth para endpoints API del portal comercio.
 *
 * Reemplaza al patrón legacy `hasAnyRole(session, ["MERCHANT", "ADMIN"])` (y al
 * uso de `session.user.merchantId`) que consultaban el JWT — un cache que puede
 * estar stale respecto al estado real del dominio. Este helper consulta la tabla
 * `Merchant` directamente (source of truth canónico, alineado con
 * `computeUserAccess` usado en los layouts protegidos y con `requireDriverApi`).
 *
 * Contexto del bug que resuelve (fix/merchant-api-db-auth, 2026-06-16):
 *   Cuando OPS aprueba un comercio, la DB pasa a APPROVED al instante pero el JWT
 *   del comercio queda con la foto vieja hasta que el socket `roles_updated`
 *   dispara `session.update({refreshRoles:true})`. En esa ventana, el panel
 *   (/api/merchant/stats, /api/merchant/onboarding, etc.) devolvía 403 aunque en
 *   DB el comercio ya estuviera aprobado. El layout protegido pasaba porque usa
 *   DB; los endpoints API fallaban porque usaban el JWT. Mismo patrón que ya
 *   resolvimos para el driver con requireDriverApi.
 *
 * Uso típico:
 *   const authResult = await requireMerchantApi();
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { merchant } = authResult;
 *   // acá merchant está garantizado NON-null (a menos que allowAdmin y sea admin)
 *
 * Para endpoints que también aceptan ADMIN (ej: ver datos de cualquier comercio
 * por ?merchantId=):
 *   const authResult = await requireMerchantApi({ allowAdmin: true });
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { merchant, isAdmin } = authResult;
 *   // merchant puede ser null si isAdmin === true y el admin no tiene comercio propio
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Merchant } from "@prisma/client";

export type MerchantApiAuthOk = {
    userId: string;
    merchant: Merchant | null;
    isAdmin: boolean;
};

export async function requireMerchantApi(options?: {
    allowAdmin?: boolean;
}): Promise<NextResponse | MerchantApiAuthOk> {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const isAdmin = (session.user as { role?: string }).role === "ADMIN";

    // Source of truth: la tabla Merchant. Replicamos el lookup que ya hacían los
    // endpoints (findFirst por ownerId), ordenado por createdAt para ser
    // determinístico cuando un owner tiene más de un comercio (igual criterio que
    // computeUserAccess: take 1, asc).
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId },
        orderBy: { createdAt: "asc" },
    });

    if (!merchant && !(options?.allowAdmin && isAdmin)) {
        return NextResponse.json(
            { error: "No tenés un comercio asociado" },
            { status: 403 },
        );
    }

    return { userId, merchant, isAdmin };
}
