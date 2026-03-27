import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Tipos de espacio publicitario con mapping a premium
const AD_TYPE_CONFIG: Record<string, {
    label: string;
    priceField: string;
    premiumTier?: string;
    maxSlotsField?: string;
}> = {
    DESTACADO_PLATINO: {
        label: "Platino — Posición #1 garantizada",
        priceField: "adPricePlatino",
        premiumTier: "platino",
        maxSlotsField: "adMaxDestacadosSlots",
    },
    DESTACADO_DESTACADO: {
        label: "Destacado — Top 3 en categorías",
        priceField: "adPriceDestacado",
        premiumTier: "destacado",
        maxSlotsField: "adMaxDestacadosSlots",
    },
    DESTACADO_PREMIUM: {
        label: "Premium — Badge + posición preferencial",
        priceField: "adPricePremium",
        premiumTier: "basic",
        maxSlotsField: "adMaxDestacadosSlots",
    },
    HERO_BANNER: {
        label: "Hero Banner — Full-width arriba del todo",
        priceField: "adPriceHeroBanner",
        maxSlotsField: "adMaxHeroBannerSlots",
    },
    BANNER_PROMO: {
        label: "Banner Promocional — Full-width con CTA",
        priceField: "adPriceBannerPromo",
    },
    PRODUCTO: {
        label: "Producto Destacado — Por producto individual",
        priceField: "adPriceProducto",
        maxSlotsField: "adMaxProductosSlots",
    },
};

const createSchema = z.object({
    type: z.enum([
        "DESTACADO_PLATINO",
        "DESTACADO_DESTACADO",
        "DESTACADO_PREMIUM",
        "HERO_BANNER",
        "BANNER_PROMO",
        "PRODUCTO",
    ]),
    notes: z.string().max(500).optional(),
    paymentMethod: z.enum(["mercadopago", "transferencia"]).default("mercadopago"),
});

// GET — Merchant ve sus placements
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Buscar merchant del usuario
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId },
        select: { id: true },
    });

    if (!merchant) {
        return NextResponse.json({ error: "No sos un comercio registrado" }, { status: 403 });
    }

    const placements = await prisma.adPlacement.findMany({
        where: { merchantId: merchant.id },
        orderBy: { createdAt: "desc" },
    });

    // También devolver precios actuales y descuento para mostrar en catálogo
    const settings = await prisma.storeSettings.findUnique({
        where: { id: "settings" },
        select: {
            adPricePlatino: true,
            adPriceDestacado: true,
            adPricePremium: true,
            adPriceHeroBanner: true,
            adPriceBannerPromo: true,
            adPriceProducto: true,
            adLaunchDiscountPercent: true,
            adMaxHeroBannerSlots: true,
            adMaxDestacadosSlots: true,
            adMaxProductosSlots: true,
            bankName: true,
            bankAccountHolder: true,
            bankCbu: true,
            bankAlias: true,
            bankCuit: true,
        },
    });

    // Armar pricing como mapeo tipo → precio
    const pricing: Record<string, number> = {};
    for (const [type, config] of Object.entries(AD_TYPE_CONFIG)) {
        pricing[type] = (settings as any)?.[config.priceField] ?? 0;
    }

    // Datos bancarios para transferencias (solo si hay CBU configurado)
    const bankInfo = settings?.bankCbu ? {
        bankName: settings.bankName || "",
        bankAccountHolder: settings.bankAccountHolder || "",
        bankCbu: settings.bankCbu || "",
        bankAlias: settings.bankAlias || "",
        bankCuit: settings.bankCuit || "",
    } : null;

    return NextResponse.json({
        placements,
        settings: {
            adLaunchDiscountPercent: settings?.adLaunchDiscountPercent ?? 0,
        },
        adTypes: AD_TYPE_CONFIG,
        pricing,
        bankInfo,
    });
}

// POST — Merchant solicita un espacio publicitario
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId, approvalStatus: "APPROVED" },
        select: { id: true, name: true, isPremium: true, premiumTier: true },
    });

    if (!merchant) {
        return NextResponse.json(
            { error: "Tu comercio debe estar aprobado para solicitar publicidad" },
            { status: 403 }
        );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Datos inválidos", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { type, notes, paymentMethod } = parsed.data;
    const typeConfig = AD_TYPE_CONFIG[type];

    // Verificar que no tenga una solicitud pendiente o activa del mismo tipo
    const existing = await prisma.adPlacement.findFirst({
        where: {
            merchantId: merchant.id,
            type,
            status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
        },
    });

    if (existing) {
        const statusLabel = existing.status === "PENDING" ? "pendiente de aprobación"
            : existing.status === "APPROVED" ? "aprobada (pendiente de pago)"
            : "activa";
        return NextResponse.json(
            { error: `Ya tenés una solicitud ${statusLabel} para ${typeConfig.label}. Esperá a que se resuelva antes de solicitar otra.` },
            { status: 409 }
        );
    }

    // Obtener precios
    const settings = await prisma.storeSettings.findUnique({
        where: { id: "settings" },
    });

    const originalAmount = (settings as any)?.[typeConfig.priceField] ?? 0;
    const discountPercent = settings?.adLaunchDiscountPercent ?? 0;
    const amount = discountPercent > 0
        ? Math.round(originalAmount * (1 - discountPercent / 100))
        : originalAmount;

    // Verificar slots disponibles si aplica
    if (typeConfig.maxSlotsField) {
        const maxSlots = (settings as any)?.[typeConfig.maxSlotsField] ?? 8;
        const activeCount = await prisma.adPlacement.count({
            where: {
                type: { startsWith: type.startsWith("DESTACADO") ? "DESTACADO" : type },
                status: "ACTIVE",
            },
        });

        if (activeCount >= maxSlots) {
            return NextResponse.json(
                { error: `No hay espacios disponibles para ${typeConfig.label} en este momento. Dejamos tu solicitud en lista de espera.` },
                { status: 200 }, // No es error, es info
            );
        }
    }

    const placement = await prisma.adPlacement.create({
        data: {
            merchantId: merchant.id,
            type,
            status: "PENDING",
            amount,
            originalAmount: discountPercent > 0 ? originalAmount : null,
            paymentMethod,
            notes: notes || null,
        },
    });

    // TODO: Notificar al admin por Socket.IO / email
    console.log(`[ad-placement] Nueva solicitud: ${merchant.name} → ${type} ($${amount}) via ${paymentMethod}`);

    const message = paymentMethod === "mercadopago"
        ? "Solicitud enviada. Una vez aprobada, te enviaremos el link de pago de MercadoPago para activación inmediata."
        : "Solicitud enviada. Una vez aprobada, te indicaremos los datos para transferencia. Tu anuncio se activa cuando confirmemos el pago.";

    return NextResponse.json({ placement, message }, { status: 201 });
}