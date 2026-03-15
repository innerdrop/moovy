// Admin Listing Update API - Approve/Pause/Reject listing
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

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
