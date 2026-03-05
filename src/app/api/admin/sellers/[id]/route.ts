// Admin Seller Update API - Verify/Suspend/Reactivate
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const seller = await prisma.sellerProfile.findUnique({ where: { id } });
        if (!seller) {
            return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });
        }

        const body = await req.json();
        const updateData: any = {};

        if (typeof body.isVerified === "boolean") {
            updateData.isVerified = body.isVerified;
        }
        if (typeof body.isActive === "boolean") {
            updateData.isActive = body.isActive;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 });
        }

        const updated = await prisma.sellerProfile.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { name: true, email: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating seller:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
