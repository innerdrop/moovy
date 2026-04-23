// API Route: Merchant Registration
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { applyRateLimit } from "@/lib/rate-limit";
import { sendMerchantRequestNotification } from "@/lib/email";
import { encryptMerchantData } from "@/lib/fiscal-crypto";
import { logAudit } from "@/lib/audit";
import { recordConsent } from "@/lib/consent";
import { PRIVACY_POLICY_VERSION, TERMS_VERSION } from "@/lib/legal-versions";
import { validateBankAccount } from "@/lib/bank-account";

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

        // Validate CUIT (11 digits)
        if (!data.cuit || data.cuit.replace(/\D/g, "").length < 11) {
            return NextResponse.json(
                { error: "El CUIT es obligatorio y debe tener 11 dígitos" },
                { status: 400 }
            );
        }

        // Validate CBU/Alias con lib canónica (autodetecta tipo, corre checksum BCRA
        // para CBU y charset + rango para alias). Defense in depth: aunque el form ya
        // valida, server-side nunca confía en el cliente.
        const bankCheck = validateBankAccount(data.cbu);
        if (!bankCheck.valid) {
            return NextResponse.json(
                { error: bankCheck.error || "CBU o Alias inválido" },
                { status: 400 }
            );
        }
        // Usamos el valor normalizado (sin espacios/guiones en CBU, trim en alias).
        data.cbu = bankCheck.normalized;

        // Validate legal acceptance
        if (!data.acceptedTerms || !data.acceptedPrivacy) {
            return NextResponse.json(
                { error: "Debés aceptar los Términos para Comercios y la Política de Privacidad" },
                { status: 400 }
            );
        }

        // Check if email already exists.
        // Ya no consultamos UserRole: el rol COMERCIO se deriva de Merchant.approvalStatus
        // en cada request. Ver src/lib/roles.ts.
        //
        // Regla (2026-04-21): NUNCA registrar un Merchant contra un User soft-deleted.
        // Antes, si una cuenta había sido eliminada, el registro de comercio
        // creaba un Merchant nuevo colgado del ownerId viejo → efecto "resurrección"
        // (ver fix paralelo en auth/register/route.ts).
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
            select: {
                id: true,
                deletedAt: true,
                ownedMerchants: { select: { id: true }, take: 1 },
            }
        });

        if (existingUser?.deletedAt) {
            await logAudit({
                action: "ACCOUNT_RESURRECTION_BLOCKED",
                entityType: "user",
                entityId: existingUser.id,
                userId: existingUser.id,
                details: {
                    email: data.email,
                    deletedAt: existingUser.deletedAt.toISOString(),
                    source: "auth/register/merchant",
                    businessName: data.businessName,
                    timestamp: new Date().toISOString(),
                },
            }).catch((e) => console.error("[Register Merchant] audit log failed:", e));

            return NextResponse.json(
                {
                    error:
                        "Esta cuenta fue eliminada. Si creés que fue un error, escribinos a soporte.",
                },
                { status: 410 }
            );
        }

        // If user exists AND already has a merchant, reject
        if (existingUser && existingUser.ownedMerchants && existingUser.ownedMerchants.length > 0) {
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

        const resultUser = await prisma.$transaction(async (tx) => {
            if (existingUser) {
                // PATH A: user already exists → solo creamos el Merchant.
                // No tocamos UserRole: el rol COMERCIO se deriva del Merchant existiendo.
                await tx.merchant.create({
                    data: { ...merchantData, ownerId: existingUser.id }
                });
                return { id: existingUser.id };
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
                        termsConsentAt: new Date(),
                        termsConsentVersion: TERMS_VERSION,
                        privacyConsentAt: new Date(),
                        privacyConsentVersion: PRIVACY_POLICY_VERSION,
                    }
                });

                await tx.merchant.create({
                    data: { ...merchantData, ownerId: newUser.id }
                });
                return { id: newUser.id };
            }
        });

        // Ley 25.326 + AAIP: registrar consentimientos en ConsentLog
        try {
            await recordConsent({
                userId: resultUser.id,
                consentType: "TERMS",
                version: TERMS_VERSION,
                action: "ACCEPT",
                request,
                details: { context: "merchant_registration" },
            });
            await recordConsent({
                userId: resultUser.id,
                consentType: "PRIVACY",
                version: PRIVACY_POLICY_VERSION,
                action: "ACCEPT",
                request,
                details: { context: "merchant_registration" },
            });
        } catch (err) {
            console.error("[REGISTER MERCHANT] Failed to persist consent log:", err);
        }

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
