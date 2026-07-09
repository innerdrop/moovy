// Loaders compartidos para el hub de Mi Comercio y sus sub-páginas.
// Rama: feat/bloquear-publicidad (reorg del panel comercio)
//
// Evita duplicar el mapeo de props (que es grande) en cada sub-página.

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { decryptMerchantData } from "@/lib/fiscal-crypto";
import { getRequiredDocumentFields } from "@/lib/merchant-document-approval";

/** Datos para MiComercioForm (perfil + horarios). Null si no hay comercio asociado. */
export async function loadProfileMerchant() {
    const session = await auth();
    if (!session?.user?.id) redirect("/comercios/login");
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: session.user.id },
        include: { owner: true },
    });
    if (!merchant) return null;
    return {
        id: merchant.id,
        name: merchant.name,
        description: merchant.description || "",
        image: merchant.image || "",
        banner: merchant.banner || "",
        email: merchant.email || "",
        phone: merchant.phone || "",
        address: merchant.address || "",
        category: merchant.category || "Otro",
        deliveryFee: merchant.deliveryFee,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        firstName: merchant.owner.firstName || "",
        lastName: merchant.owner.lastName || "",
        ownerPhone: merchant.owner.phone || "",
        scheduleEnabled: merchant.scheduleEnabled,
        scheduleJson: merchant.scheduleJson,
        instagramUrl: merchant.instagramUrl,
        facebookUrl: merchant.facebookUrl,
        whatsappNumber: merchant.whatsappNumber,
    };
}

/** Datos para SettingsForm (estado, entregas, MercadoPago, documentación). */
export async function loadSettingsMerchant() {
    const session = await auth();
    if (!session?.user?.id) redirect("/comercios/login");
    const merchantRaw = await prisma.merchant.findFirst({ where: { ownerId: session.user.id } });
    if (!merchantRaw) return null;
    // El comercio tiene derecho a ver su propia info fiscal sin enmascarar.
    const merchant = decryptMerchantData(merchantRaw as any) as typeof merchantRaw;
    const m = merchant as any;
    const requiredDocFields = await getRequiredDocumentFields(merchant.category);
    return {
        requiredDocFields,
        merchant: {
            id: merchant.id,
            name: merchant.name,
            image: merchant.image || "",
            isOpen: merchant.isOpen,
            deliveryTimeMin: merchant.deliveryTimeMin,
            deliveryTimeMax: merchant.deliveryTimeMax,
            deliveryFee: merchant.deliveryFee,
            minOrderAmount: merchant.minOrderAmount,
            deliveryRadiusKm: merchant.deliveryRadiusKm,
            allowPickup: merchant.allowPickup,
            commissionRate: merchant.commissionRate,
            mpEmail: merchant.mpEmail,
            mpLinkedAt: merchant.mpLinkedAt?.toISOString() || null,
            mpUserId: merchant.mpUserId,
            cuit: merchant.cuit,
            bankAccount: merchant.bankAccount,
            constanciaAfipUrl: merchant.constanciaAfipUrl,
            habilitacionMunicipalUrl: merchant.habilitacionMunicipalUrl,
            registroSanitarioUrl: merchant.registroSanitarioUrl,
            cuitStatus: (m.cuitStatus as any) || "PENDING",
            cuitRejectionReason: m.cuitRejectionReason || null,
            cuitApprovalSource: (m as any).cuitApprovalSource || null,
            bankAccountStatus: (m.bankAccountStatus as any) || "PENDING",
            bankAccountRejectionReason: m.bankAccountRejectionReason || null,
            bankAccountApprovalSource: (m as any).bankAccountApprovalSource || null,
            constanciaAfipStatus: (m.constanciaAfipStatus as any) || "PENDING",
            constanciaAfipRejectionReason: m.constanciaAfipRejectionReason || null,
            constanciaAfipApprovalSource: (m as any).constanciaAfipApprovalSource || null,
            habilitacionMunicipalStatus: (m.habilitacionMunicipalStatus as any) || "PENDING",
            habilitacionMunicipalRejectionReason: m.habilitacionMunicipalRejectionReason || null,
            habilitacionMunicipalApprovalSource: (m as any).habilitacionMunicipalApprovalSource || null,
            registroSanitarioStatus: (m.registroSanitarioStatus as any) || "PENDING",
            registroSanitarioRejectionReason: m.registroSanitarioRejectionReason || null,
            registroSanitarioApprovalSource: (m as any).registroSanitarioApprovalSource || null,
            approvalStatus: merchant.approvalStatus,
            category: merchant.category,
        },
    };
}
