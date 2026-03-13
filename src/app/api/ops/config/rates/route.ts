// API Route: Ops Delivery Rates Config
// GET  → returns all DeliveryRate rows with category name
// PATCH → updates one rate by id
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

        const rates = await prisma.deliveryRate.findMany({
            include: {
                category: {
                    select: { name: true, displayOrder: true },
                },
            },
            orderBy: { category: { displayOrder: "asc" } },
        });

        return NextResponse.json({ rates });
    } catch (error) {
        console.error("Error fetching delivery rates:", error);
        return NextResponse.json(
            { error: "Error al obtener tarifas" },
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
        const { id, basePriceArs, pricePerKmArs } = body;

        if (!id) {
            return NextResponse.json(
                { error: "id es requerido" },
                { status: 400 }
            );
        }

        if (basePriceArs === undefined && pricePerKmArs === undefined) {
            return NextResponse.json(
                { error: "basePriceArs o pricePerKmArs son requeridos" },
                { status: 400 }
            );
        }

        const updateData: Record<string, number> = {};
        if (basePriceArs !== undefined) updateData.basePriceArs = Number(basePriceArs);
        if (pricePerKmArs !== undefined) updateData.pricePerKmArs = Number(pricePerKmArs);

        const updated = await prisma.deliveryRate.update({
            where: { id },
            data: updateData,
            include: {
                category: { select: { name: true } },
            },
        });

        return NextResponse.json({ rate: updated });
    } catch (error) {
        console.error("Error updating delivery rate:", error);
        return NextResponse.json(
            { error: "Error al actualizar tarifa" },
            { status: 500 }
        );
    }
}
