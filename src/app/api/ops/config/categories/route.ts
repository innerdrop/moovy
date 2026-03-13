// API Route: Ops Package Categories Config
// GET  → returns all PackageCategory rows
// PATCH → updates one category by id
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const categories = await prisma.packageCategory.findMany({
            orderBy: { displayOrder: "asc" },
            include: { deliveryRate: true },
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error("Error fetching package categories:", error);
        return NextResponse.json(
            { error: "Error al obtener categorías de paquete" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...fields } = body;

        if (!id) {
            return NextResponse.json(
                { error: "id es requerido" },
                { status: 400 }
            );
        }

        // Validate allowed fields
        const allowedFields = [
            "maxWeightGrams",
            "maxLengthCm",
            "maxWidthCm",
            "maxHeightCm",
            "volumeScore",
            "allowedVehicles",
        ];
        const updateData: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (fields[key] !== undefined) {
                updateData[key] = fields[key];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No se enviaron campos para actualizar" },
                { status: 400 }
            );
        }

        const updated = await prisma.packageCategory.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ category: updated });
    } catch (error) {
        console.error("Error updating package category:", error);
        return NextResponse.json(
            { error: "Error al actualizar categoría" },
            { status: 500 }
        );
    }
}
