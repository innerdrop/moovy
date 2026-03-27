import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * PATCH - Update merchant premium status (isPremium, premiumTier, premiumUntil, displayOrder)
 * This is a dedicated endpoint for premium management operations.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    try {
        const updateData: Record<string, any> = {};

        // Premium status toggle
        if (typeof body.isPremium === "boolean") {
            updateData.isPremium = body.isPremium;
        }

        // Premium tier (basic, destacado, platino)
        if (body.premiumTier !== undefined) {
            if (body.premiumTier === null) {
                updateData.premiumTier = null;
            } else if (["basic", "destacado", "platino"].includes(body.premiumTier)) {
                updateData.premiumTier = body.premiumTier;
            } else {
                return NextResponse.json(
                    { error: "Tier inválido. Use: basic, destacado, platino" },
                    { status: 400 }
                );
            }
        }

        // Premium expiry date
        if (body.premiumUntil !== undefined) {
            if (body.premiumUntil === null) {
                updateData.premiumUntil = null;
            } else {
                const expiryDate = new Date(body.premiumUntil);
                if (isNaN(expiryDate.getTime())) {
                    return NextResponse.json(
                        { error: "Fecha inválida" },
                        { status: 400 }
                    );
                }
                updateData.premiumUntil = expiryDate;
            }
        }

        // Display order
        if (body.displayOrder !== undefined) {
            const order = parseInt(body.displayOrder, 10);
            if (isNaN(order)) {
                return NextResponse.json(
                    { error: "displayOrder debe ser un número" },
                    { status: 400 }
                );
            }
            updateData.displayOrder = order;
        }

        // If no valid fields provided, return error
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No se proporcionaron campos válidos para actualizar" },
                { status: 400 }
            );
        }

        // Validate slot limits when activating premium
        if (updateData.isPremium === true) {
            const settings = await prisma.storeSettings.findUnique({
                where: { id: "settings" },
                select: { adMaxDestacadosSlots: true },
            });
            const maxSlots = settings?.adMaxDestacadosSlots ?? 8;

            const currentPremiumCount = await prisma.merchant.count({
                where: {
                    isPremium: true,
                    id: { not: id }, // Excluir el merchant actual
                },
            });

            if (currentPremiumCount >= maxSlots) {
                return NextResponse.json(
                    { error: `Límite alcanzado: máximo ${maxSlots} comercios destacados permitidos. Desactivá uno antes de agregar otro.` },
                    { status: 409 }
                );
            }
        }

        // Update merchant
        const merchant = await prisma.merchant.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                isPremium: true,
                premiumTier: true,
                premiumUntil: true,
                displayOrder: true,
                isActive: true,
                rating: true,
                _count: {
                    select: { orders: true }
                }
            },
        });

        return NextResponse.json(merchant, { status: 200 });
    } catch (error) {
        console.error("Error updating merchant premium:", error);
        return NextResponse.json(
            { error: "Error al actualizar comercio" },
            { status: 500 }
        );
    }
}
