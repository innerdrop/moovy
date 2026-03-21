import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSellerData } from "@/lib/fiscal-crypto";

// POST - Activate SELLER role for authenticated user
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Parse body (may be empty for legacy calls)
        let body: { cuit?: string; acceptedTerms?: boolean } = {};
        try {
            body = await request.json();
        } catch {
            // Empty body — legacy call without data
        }

        // Validate required fields
        if (!body.cuit) {
            return NextResponse.json(
                { error: "El CUIT es obligatorio para activar el rol de vendedor" },
                { status: 400 }
            );
        }

        if (!body.acceptedTerms) {
            return NextResponse.json(
                { error: "Debés aceptar los Términos para Vendedores" },
                { status: 400 }
            );
        }

        // Check if already a seller
        const existingRole = await prisma.userRole.findUnique({
            where: { userId_role: { userId, role: "SELLER" } }
        });
        if (existingRole) {
            return NextResponse.json(
                { error: "Ya tenés el rol de vendedor" },
                { status: 409 }
            );
        }

        // Create seller role + SellerProfile in transaction
        await prisma.$transaction(async (tx) => {
            // 1. Create UserRole
            await tx.userRole.create({
                data: { userId, role: "SELLER", isActive: true }
            });

            // 2. Create SellerProfile with CUIT and terms acceptance
            const existingProfile = await tx.sellerProfile.findUnique({
                where: { userId }
            });

            if (!existingProfile) {
                const profileData = { userId, cuit: body.cuit || null, acceptedTermsAt: body.acceptedTerms ? new Date() : null };
                const encryptedData = encryptSellerData(profileData);
                await tx.sellerProfile.create({
                    data: encryptedData
                });
            } else {
                // Update existing profile with CUIT and terms
                const updateData = {
                    cuit: body.cuit || existingProfile.cuit,
                    acceptedTermsAt: body.acceptedTerms ? new Date() : existingProfile.acceptedTermsAt,
                };
                const encryptedData = encryptSellerData(updateData);
                await tx.sellerProfile.update({
                    where: { userId },
                    data: encryptedData
                });
            }
        });

        return NextResponse.json({ success: true, role: "SELLER", status: "ACTIVE" });
    } catch (error) {
        console.error("Error activating seller:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
