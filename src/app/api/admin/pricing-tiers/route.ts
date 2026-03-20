import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET — list all pricing tiers
export async function GET() {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN", "MERCHANT"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const tiers = await prisma.packagePricingTier.findMany({
            orderBy: { order: "asc" },
        });

        return NextResponse.json(tiers);
    } catch (error) {
        console.error("Error fetching pricing tiers:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST — create a new tier
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const { name, minItems, maxItems, pricePerItem, totalPrice } = body;

        if (!name || !minItems || !pricePerItem || !totalPrice) {
            return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
        }

        // Get max order
        const lastTier = await prisma.packagePricingTier.findFirst({
            orderBy: { order: "desc" },
        });

        const tier = await prisma.packagePricingTier.create({
            data: {
                name,
                minItems: Number(minItems),
                maxItems: maxItems ? Number(maxItems) : null,
                pricePerItem: Number(pricePerItem),
                totalPrice: Number(totalPrice),
                isActive: true,
                order: (lastTier?.order || 0) + 1,
            },
        });

        return NextResponse.json(tier);
    } catch (error) {
        console.error("Error creating pricing tier:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// PATCH — update a tier
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        // Convert numeric fields
        const data: any = {};
        if (updates.name !== undefined) data.name = updates.name;
        if (updates.minItems !== undefined) data.minItems = Number(updates.minItems);
        if (updates.maxItems !== undefined) data.maxItems = updates.maxItems ? Number(updates.maxItems) : null;
        if (updates.pricePerItem !== undefined) data.pricePerItem = Number(updates.pricePerItem);
        if (updates.totalPrice !== undefined) data.totalPrice = Number(updates.totalPrice);
        if (updates.isActive !== undefined) data.isActive = updates.isActive;

        const tier = await prisma.packagePricingTier.update({
            where: { id },
            data,
        });

        return NextResponse.json(tier);
    } catch (error) {
        console.error("Error updating pricing tier:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE — remove a tier
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        await prisma.packagePricingTier.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting pricing tier:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
