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
    const limited = applyRateLimit(request, "auth:register:merchant", 5, 15 * 60_000);
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

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
            include: {
                roles: { where: { isActive: true }, select: { role: true } },
                ownedMerchants: { select: { id: true }, take: 1 },
            }
        });

        // If user exists AND already has a merchant, reject
        if (existingUser?.ownedMerchants && existingUser.ownedMerchants.length > 0) {
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
                // --- PATH A: User already exists (has a store/driver account) ---
                // Add MERCHANT role if not already present
                const hasMerchantRole = existingUser.roles.some((r: { role: string }) => r.role === "COMERCIO");
                if (!hasMerchantRole) {
                    await tx.userRole.create({
                        data: { userId: existingUser.id, role: "COMERCIO", isActive: true }
                    });
                }

                // Create Merchant linked to existing user
                await tx.merchant.create({
                    data: { ...merchantData, ownerId: existingUser.id }
                });
            } else {
                // --- PATH B: Brand new user ---
                // 1. Create User with legacy role USER (base account)
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

                // 2. Create UserRole entries: USER (base) + MERCHANT
                await tx.userRole.createMany({
                    data: [
                        { userId: newUser.id, role: "USER", isActive: true },
                        { userId: newUser.id, role: "COMERCIO", isActive: true },
                    ]
                });

                // 3. Create Merchant
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
