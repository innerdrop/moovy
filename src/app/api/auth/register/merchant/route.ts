// API Route: Merchant Registration
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { applyRateLimit } from "@/lib/rate-limit";
import { sendMerchantRequestNotification } from "@/lib/email";
import { encryptMerchantData } from "@/lib/fiscal-crypto";

export const dynamic = "force-dynamic";

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

export async function POST(request: NextRequest) {
    // Rate limit: max 5 registrations per 15 minutes per IP
    const limited = await applyRateLimit(request, "auth:register:merchant", 5, 15 * 60_000);
    if (limited) return limited;

    try {
        const data = await request.json();
        console.log("[Register Merchant] Received:", data.businessName);

        // Validate required fields
        if (!data.email || !data.password || !data.firstName || !data.businessName) {
            return NextResponse.json(
                { error: "Faltan datos obligatorios" },
                { status: 400 }
            );
        }

        // Validate legal acceptance
        if (!data.acceptedTerms || !data.acceptedPrivacy) {
            return NextResponse.json(
                { error: "Debés aceptar los Términos para Comercios y la Política de Privacidad" },
                { status: 400 }
            );
        }

        // Check if email already exists (ignore soft-deleted users).
        // Ya no consultamos UserRole: el rol COMERCIO se deriva de Merchant.approvalStatus
        // en cada request. Ver src/lib/roles.ts.
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
            select: {
                id: true,
                deletedAt: true,
                ownedMerchants: { select: { id: true }, take: 1 },
            }
        });

        // If user exists, is NOT deleted, AND already has a merchant, reject
        if (existingUser && !existingUser.deletedAt && existingUser.ownedMerchants && existingUser.ownedMerchants.length > 0) {
            return NextResponse.json(
                { error: "Ya tenés un comercio registrado con ese email" },
                { status: 409 }
            );
        }

        // Generate slug
        let slug = generateSlug(data.businessName);
        const existingSlug = await prisma.merchant.findUnique({
            where: { slug }
        });
        if (existingSlug) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

        // Merchant data (shared between both paths)
        let merchantData = {
            name: data.businessName,
            businessName: data.businessName,
            slug: slug,
            category: data.businessType,
            cuit: data.cuit || null,
            bankAccount: data.cbu || null,
            constanciaAfipUrl: data.constanciaAfipUrl || null,
            habilitacionMunicipalUrl: data.habilitacionMunicipalUrl || null,
            registroSanitarioUrl: data.registroSanitarioUrl || null,
            acceptedTermsAt: data.acceptedTerms ? new Date() : null,
            acceptedPrivacyAt: data.acceptedPrivacy ? new Date() : null,
            email: data.email,
            phone: data.businessPhone || data.phone,
            address: data.address,
            latitude: data.latitude ? parseFloat(data.latitude) : null,
            longitude: data.longitude ? parseFloat(data.longitude) : null,
            description: data.description || "Nuevo comercio Moovy",
            isActive: false,
            isVerified: false,
        };

        // Encrypt sensitive fiscal data before saving
        merchantData = encryptMerchantData(merchantData);

        await prisma.$transaction(async (tx) => {
            if (existingUser) {
                // PATH A: user already exists → solo creamos el Merchant.
                // No tocamos UserRole: el rol COMERCIO se deriva del Merchant existiendo.
                await tx.merchant.create({
                    data: { ...merchantData, ownerId: existingUser.id }
                });
            } else {
                // PATH B: user nuevo → creamos User + Merchant.
                const newUser = await tx.user.create({
                    data: {
                        email: data.email,
                        password: hashedPassword,
                        name: fullName,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        phone: data.phone,
                        role: 'USER',
                    }
                });

                await tx.merchant.create({
                    data: { ...merchantData, ownerId: newUser.id }
                });
            }
        });

        // Notify admin about new merchant application (non-blocking)
        sendMerchantRequestNotification(
            data.businessName,
            `${data.firstName} ${data.lastName}`.trim(),
            data.email,
            data.businessType || null
        );

        return NextResponse.json({
            success: true,
            message: "Solicitud enviada exitosamente"
        });

    } catch (error: any) {
        console.error("[Register Merchant] Error:", error);
        return NextResponse.json(
            { error: `Error al registrar: ${error.message}` },
            { status: 500 }
        );
    }
}
