// API Route: Single Address Operations
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Get single address
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;

        const address = await prisma.address.findUnique({
            where: {
                id: id,
                // Ensure ownership implicitly? No, findUnique only keys by ID. 
                // We must check userId after or use findFirst. 
            }
        });

        if (!address || address.userId !== session.user.id) {
            return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
        }

        return NextResponse.json(address);

    } catch (error) {
        console.error("Error fetching address:", error);
        return NextResponse.json({ error: "Error al obtener dirección" }, { status: 500 });
    }
}

// PATCH - Update address
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const data = await request.json();

        // Check ownership first
        const existing = await prisma.address.findUnique({
            where: { id }
        });

        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            if (data.isDefault) {
                // Disable other defaults
                await tx.address.updateMany({
                    where: { userId: session.user.id, isDefault: true, id: { not: id } },
                    data: { isDefault: false }
                });
            }

            return await tx.address.update({
                where: { id },
                data: {
                    label: data.label,
                    street: data.street,
                    number: data.number,
                    apartment: data.apartment,
                    neighborhood: data.neighborhood,
                    city: data.city,
                    province: data.province,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    isDefault: data.isDefault,
                    // Prisma ignores undefined values in update usually, but explicit cleaner is good practice if using spread
                }
            });
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error updating address:", error);
        return NextResponse.json({ error: "Error al actualizar dirección" }, { status: 500 });
    }
}

// DELETE - Delete address
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;

        // Verify ownership via deleteMany count or findFirst
        // prisma.address.delete({ where: { id } }) doesn't check userId check unless we verify first.

        const existing = await prisma.address.findFirst({
            where: { id, userId: session.user.id }
        });

        if (!existing) {
            return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
        }

        await prisma.address.update({
            where: { id },
            data: {
                // @ts-ignore
                deletedAt: new Date(),
                isDefault: false // Clear default status if deleted
            }
        });

        return NextResponse.json({ success: true, message: "Dirección eliminada" });

    } catch (error) {
        console.error("Error deleting address:", error);
        return NextResponse.json({ error: "Error al eliminar dirección" }, { status: 500 });
    }
}
