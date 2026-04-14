// Admin Listing API - Approve/Pause/Reject (PUT) + Soft Delete (DELETE)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const listing = await prisma.listing.findUnique({
            where: { id },
        });
        if (!listing) {
            return NextResponse.json({ error: "Listing no encontrada" }, { status: 404 });
        }

        const body = await req.json();
        const updateData: any = {};

        if (typeof body.isActive === "boolean") {
            updateData.isActive = body.isActive;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 });
        }

        const updated = await prisma.listing.update({
            where: { id },
            data: updateData,
            include: {
                seller: { select: { displayName: true } },
            },
        });

        // Log rejection reason for audit trail
        if (body.isActive === false && body.rejectionReason) {
            console.log(`[MODERATION] Listing "${listing.title}" (${id}) paused by admin. Reason: ${body.rejectionReason}`);
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating listing:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// Soft-delete listing (OPS moderation)
// Body opcional: { reason?: string }
// Marca deletedAt/deletedBy/deletedReason. No se puede revertir desde UI.
// Registra audit log para trazabilidad.
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const listing = await prisma.listing.findUnique({
            where: { id },
            select: { id: true, title: true, sellerId: true, deletedAt: true },
        });

        if (!listing) {
            return NextResponse.json({ error: "Listing no encontrada" }, { status: 404 });
        }

        if (listing.deletedAt) {
            return NextResponse.json({ error: "Este listing ya fue eliminado" }, { status: 410 });
        }

        // Parse body opcional — el reason es opcional, el body puede estar vacío
        let reason: string | null = null;
        try {
            const body = await req.json();
            if (body?.reason && typeof body.reason === "string" && body.reason.trim()) {
                reason = body.reason.trim().slice(0, 500); // cap a 500 chars
            }
        } catch {
            // body vacío o inválido — OK, reason queda null
        }

        const adminId = session.user?.id;
        if (!adminId) {
            return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.listing.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    deletedBy: adminId,
                    deletedReason: reason,
                    isActive: false, // también lo desactivamos por consistencia
                },
            });
        });

        // Audit log fuera de la transacción (si falla, no rollback del delete)
        await logAudit({
            action: "LISTING_DELETE",
            entityType: "Listing",
            entityId: id,
            userId: adminId,
            details: {
                title: listing.title,
                sellerId: listing.sellerId,
                reason: reason || null,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting listing:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
