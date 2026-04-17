import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSellerData, decryptSellerData } from "@/lib/fiscal-crypto";

// POST - Activate SELLER role for authenticated user
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Parse body
        let body: { cuit?: string; acceptedTerms?: boolean; displayName?: string; bio?: string } = {};
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

        if (!body.displayName || !body.displayName.trim()) {
            return NextResponse.json(
                { error: "El nombre público es obligatorio" },
                { status: 400 }
            );
        }

        // Check if already a seller — derivado de SellerProfile (no UserRole).
        const existingProfile = await prisma.sellerProfile.findUnique({
            where: { userId },
            select: { id: true, isActive: true },
        });
        if (existingProfile && existingProfile.isActive) {
            return NextResponse.json(
                { error: "Ya tenés el rol de vendedor" },
                { status: 409 }
            );
        }

        // Check if CUIT is already registered by another seller
        // CUIT is encrypted in DB (non-deterministic AES-256-GCM), so we decrypt and compare
        if (body.cuit) {
            const normalizedCuit = body.cuit.replace(/\D/g, ""); // strip dashes for comparison
            const allSellers = await prisma.sellerProfile.findMany({
                where: { cuit: { not: null } },
                select: { userId: true, cuit: true },
            });
            const duplicateSeller = allSellers.find((s) => {
                if (!s.cuit || s.userId === userId) return false;
                const decrypted = decryptSellerData({ cuit: s.cuit });
                const decryptedNormalized = (decrypted.cuit || "").replace(/\D/g, "");
                return decryptedNormalized === normalizedCuit;
            });
            if (duplicateSeller) {
                return NextResponse.json(
                    { error: "Este CUIT ya está registrado por otro vendedor" },
                    { status: 409 }
                );
            }
        }

        // Crear/activar SellerProfile. El rol SELLER se deriva de SellerProfile.isActive
        // en cada request (ver src/lib/roles.ts), ya no escribimos UserRole.
        await prisma.$transaction(async (tx) => {
            const existing = await tx.sellerProfile.findUnique({
                where: { userId }
            });

            if (!existing) {
                const profileData = {
                    userId,
                    cuit: body.cuit || null,
                    displayName: body.displayName || null,
                    bio: body.bio || null,
                    acceptedTermsAt: body.acceptedTerms ? new Date() : null,
                    isActive: true,
                };
                const encryptedData = encryptSellerData(profileData);
                await tx.sellerProfile.create({
                    data: encryptedData
                });
            } else {
                // Reactivar perfil existente (el check anterior rechaza si ya estaba activo)
                const updateData = {
                    cuit: body.cuit || existing.cuit,
                    displayName: body.displayName || existing.displayName,
                    bio: body.bio || existing.bio,
                    acceptedTermsAt: body.acceptedTerms ? new Date() : existing.acceptedTermsAt,
                    isActive: true,
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
