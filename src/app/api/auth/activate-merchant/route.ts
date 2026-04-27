import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMerchantRequestNotification } from "@/lib/email";
import { encryptMerchantData } from "@/lib/fiscal-crypto";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateBankAccount } from "@/lib/bank-account";

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

/**
 * POST /api/auth/activate-merchant
 * Add COMERCIO role to an authenticated user who wants to register their business.
 * Only collects business data — personal data comes from existing account.
 */
export async function POST(request: NextRequest) {
    const limited = await applyRateLimit(request, "auth:activate-merchant", 5, 15 * 60_000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Check if already has a merchant
        const existingMerchant = await prisma.merchant.findFirst({
            where: { ownerId: userId },
        });
        if (existingMerchant) {
            return NextResponse.json(
                {
                    error:
                        existingMerchant.approvalStatus === "APPROVED"
                            ? "Ya tenés un comercio activo"
                            : "Tu solicitud de comercio está pendiente de aprobación",
                    status:
                        existingMerchant.approvalStatus === "APPROVED"
                            ? "ACTIVE"
                            : "PENDING_VERIFICATION",
                },
                { status: 409 }
            );
        }

        let body: Record<string, any> = {};
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
        }

        // Validate required fields (business data only — no personal data needed)
        if (!body.businessName) {
            return NextResponse.json({ error: "El nombre del comercio es obligatorio" }, { status: 400 });
        }
        // feat/registro-simplificado (2026-04-27): CUIT y CBU opcionales en activación.
        // Si vienen, se validan; si no, quedan null y el merchant los completa
        // en su panel post-activación. La aprobación sigue requiriendo ambos válidos.
        if (body.cuit && body.cuit.toString().trim().length > 0) {
            if (body.cuit.replace(/\D/g, "").length < 11) {
                return NextResponse.json({ error: "El CUIT debe tener 11 dígitos" }, { status: 400 });
            }
        }

        if (body.cbu && body.cbu.toString().trim().length > 0) {
            const bankCheck = validateBankAccount(body.cbu);
            if (!bankCheck.valid) {
                return NextResponse.json(
                    { error: bankCheck.error || "CBU o Alias inválido" },
                    { status: 400 }
                );
            }
            body.cbu = bankCheck.normalized;
        } else {
            body.cbu = null;
        }
        if (!body.acceptedTerms) {
            return NextResponse.json(
                { error: "Debés aceptar los Términos para Comercios" },
                { status: 400 }
            );
        }

        // Generate slug
        let slug = generateSlug(body.businessName);
        const existingSlug = await prisma.merchant.findUnique({ where: { slug } });
        if (existingSlug) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        // Build merchant data
        let merchantData: Record<string, any> = {
            ownerId: userId,
            name: body.businessName,
            businessName: body.businessName,
            slug,
            category: body.businessType || null,
            cuit: body.cuit || null,
            bankAccount: body.cbu || null,
            constanciaAfipUrl: body.constanciaAfipUrl || null,
            habilitacionMunicipalUrl: body.habilitacionMunicipalUrl || null,
            registroSanitarioUrl: body.registroSanitarioUrl || null,
            acceptedTermsAt: new Date(),
            acceptedPrivacyAt: body.acceptedPrivacy ? new Date() : null,
            email: session.user.email || body.email || null,
            phone: body.businessPhone || body.phone || null,
            address: body.address || null,
            latitude: body.latitude ? parseFloat(body.latitude) : null,
            longitude: body.longitude ? parseFloat(body.longitude) : null,
            description: body.description || "Nuevo comercio Moovy",
            isActive: false,
            isVerified: false,
            approvalStatus: "PENDING",
        };

        // Encrypt sensitive fiscal data
        merchantData = encryptMerchantData(merchantData);

        // Solo creamos el Merchant. El rol COMERCIO se deriva de Merchant.approvalStatus
        // en cada request (ver src/lib/roles.ts), ya no escribimos UserRole.
        await prisma.merchant.create({ data: merchantData as any });

        // Notify admin (non-blocking)
        sendMerchantRequestNotification(
            body.businessName,
            session.user.name || null,
            session.user.email || null,
            body.businessType || null
        );

        return NextResponse.json({ success: true, status: "PENDING_VERIFICATION" });
    } catch (error) {
        console.error("[ActivateMerchant] Error:", error);
        return NextResponse.json(
            { error: "Error procesando solicitud" },
            { status: 500 }
        );
    }
}