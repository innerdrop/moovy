/**
 * Auth para endpoints API del portal vendedor (marketplace).
 *
 * Rama fix/seller-api-db-auth (2026-07-06) — cierra el último 🔴 de la auditoría
 * pre-launch de auth: los endpoints de seller autorizaban con
 * `hasAnyRole(session, ["SELLER"])`, o sea el JWT — un CACHE que puede estar
 * stale hasta 7 días. Un seller suspendido o desactivado con sesión viva podía
 * seguir operando (confirmar pedidos, ponerse online).
 *
 * Este helper consulta la DB vía `computeUserAccess` (la MISMA derivación
 * canónica que usan los layouts protegidos — reglas #13/#28): perfil existente
 * + isActive + no suspendido (ni el seller ni el usuario globalmente).
 * Espejo de `requireMerchantApi` y `requireDriverApi`.
 *
 * Uso típico:
 *   const authResult = await requireSellerApi();
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { userId, sellerId } = authResult;   // sellerId garantizado non-null
 *
 * Con { allowAdmin: true }, un ADMIN pasa aunque no tenga perfil de seller
 * (sellerId puede ser null en ese caso).
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { computeUserAccess } from "@/lib/roles";

export type SellerApiAuthOk = {
    userId: string;
    /** Id del SellerProfile. Solo puede ser null si allowAdmin && isAdmin. */
    sellerId: string | null;
    isAdmin: boolean;
};

export async function requireSellerApi(options?: {
    allowAdmin?: boolean;
}): Promise<NextResponse | SellerApiAuthOk> {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const access = await computeUserAccess(session.user.id);
    if (!access) {
        // Usuario inexistente o soft-deleted con JWT vivo.
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (options?.allowAdmin && access.isAdmin) {
        return { userId: access.userId, sellerId: access.seller.sellerId, isAdmin: true };
    }

    switch (access.seller.status) {
        case "approved":
            return { userId: access.userId, sellerId: access.seller.sellerId, isAdmin: access.isAdmin };
        case "suspended":
            return NextResponse.json(
                { error: "Tu cuenta de vendedor está suspendida. Contactá al equipo de Moovy." },
                { status: 403 },
            );
        case "rejected":
            return NextResponse.json(
                { error: "Tu cuenta de vendedor está desactivada. Contactá al equipo de Moovy." },
                { status: 403 },
            );
        default:
            return NextResponse.json(
                { error: "No tenés un perfil de vendedor" },
                { status: 403 },
            );
    }
}
