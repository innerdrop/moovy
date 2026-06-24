// API OPS: borrado permanente de un pre-registro (lista de espera).
// Rama: fix/landing-fija-responsive-desktop
//
// Hard delete real (no soft delete): los PreLaunchLead son contactos de marketing,
// no actores del sistema (User/Merchant/Driver). Si la persona pide baja o ya no
// la queremos contactar, debe poder eliminarse de la base por completo (AAIP/derecho
// de supresión, Ley 25.326). Solo ADMIN. Queda registrado en el audit log.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const limited = await applyRateLimit(request, "ops:prelaunch:delete", 30, 60_000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;

        const lead = await prisma.preLaunchLead.findUnique({ where: { id } });
        if (!lead) {
            return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
        }

        await prisma.preLaunchLead.delete({ where: { id } });

        await logAudit({
            action: "PRELAUNCH_LEAD_DELETED",
            entityType: "PreLaunchLead",
            entityId: id,
            userId: session.user.id,
            details: { role: lead.role, email: lead.email, whatsapp: lead.whatsapp },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ops/prelaunch/delete] error:", error);
        return NextResponse.json({ error: "Error al eliminar el registro" }, { status: 500 });
    }
}
