// API admin: lista TODOS los flags con todos sus campos (label, description,
// lastToggled, etc.) para la pagina /ops/feature-flags. Diferente del
// /api/features/list publico que solo devuelve key + isActive.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const flags = await prisma.featureFlag.findMany({
            orderBy: [{ scope: "asc" }, { key: "asc" }],
        });

        // Enriquecer con el nombre del admin que togglo (si existe).
        const adminIds = Array.from(
            new Set(flags.map((f) => f.lastToggledByUserId).filter((id): id is string => !!id))
        );
        const admins = adminIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: adminIds } },
                select: { id: true, name: true, email: true },
            })
            : [];
        const adminsById = new Map(admins.map((a) => [a.id, a]));

        const enriched = flags.map((f) => ({
            ...f,
            lastToggledBy: f.lastToggledByUserId
                ? adminsById.get(f.lastToggledByUserId) ?? null
                : null,
        }));

        return NextResponse.json({ flags: enriched });
    } catch (error: any) {
        console.error("[admin/features GET list] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
