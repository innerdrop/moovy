// API Route: Get merchant onboarding status
import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";
import {
    getRequiredDocumentFields,
    isFoodCategory,
} from "@/lib/merchant-document-approval";

export async function GET() {
    try {
        // Auth contra DB (no contra el JWT cache): el comercio recién aprobado
        // tiene el token stale por unos segundos. Ver src/lib/merchant-auth.ts.
        // El doc se considera "cumplido" cuando su <doc>Status === "APPROVED",
        // sin importar si fue DIGITAL (con URL) o PHYSICAL (admin aprobó en papel
        // desde OPS) — bug detectado 2026-04-25.
        const authResult = await requireMerchantApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { merchant } = authResult;

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        const isFoodBusiness = isFoodCategory(merchant.category);

        // Documentos requeridos según categoría + flags de OPS
        // (feat/docs-comercio-configurables-ops). Si OPS apaga un doc, deja de
        // ser requerido y no bloquea ni aparece en el checklist.
        const requiredDocs = await getRequiredDocumentFields(merchant.category);
        const cuitRequired = requiredDocs.includes("cuit");
        const bankAccountRequired = requiredDocs.includes("bankAccount");
        const constanciaAfipRequired = requiredDocs.includes("constanciaAfipUrl");
        const habilitacionRequired = requiredDocs.includes("habilitacionMunicipalUrl");
        const registroSanitarioRequired = requiredDocs.includes("registroSanitarioUrl");

        // Get product count
        const productCount = await prisma.product.count({
            where: { merchantId: merchant.id, isActive: true },
        });

        // Un doc se considera "cumplido" cuando está APPROVED (sin importar si la
        // aprobación fue DIGITAL con URL o PHYSICAL en papel desde OPS) O cuando
        // NO es requerido (apagado desde OPS / no aplica al rubro).
        const cuitApproved = merchant.cuitStatus === "APPROVED";
        const bankApproved = merchant.bankAccountStatus === "APPROVED";
        const afipApproved = merchant.constanciaAfipStatus === "APPROVED";
        const habApproved = merchant.habilitacionMunicipalStatus === "APPROVED";
        const sanitarioApproved = merchant.registroSanitarioStatus === "APPROVED";

        const hasCuit = !cuitRequired || cuitApproved;
        const hasBankAccount = !bankAccountRequired || bankApproved;
        const hasConstanciaAfip = !constanciaAfipRequired || afipApproved;
        const hasHabilitacion = !habilitacionRequired || habApproved;
        const hasRegistroSanitario = !registroSanitarioRequired || sanitarioApproved;

        // Operational checks
        const hasLogo = Boolean(merchant.image);
        const hasSchedule = Boolean(merchant.scheduleJson);
        const hasProducts = productCount >= 1;
        const hasAddress = Boolean(merchant.address && merchant.latitude);
        const hasMercadoPago = Boolean(merchant.mpUserId);

        // All docs complete = can open store (los no requeridos cuentan como OK)
        const docsComplete = hasCuit && hasBankAccount && hasConstanciaAfip && hasHabilitacion && hasRegistroSanitario;
        // All operational = fully ready. Logo es obligatorio (rama
        // fix/comercio-onboarding-completo) — el backend bloquea la aprobación
        // del merchant si Merchant.image es null.
        const canOpenStore = docsComplete && hasSchedule && hasProducts && hasAddress && hasLogo;
        // isComplete suma MercadoPago como recomendado para "100% perfil completo".
        const isComplete = canOpenStore && hasMercadoPago;

        return NextResponse.json({
            merchantId: merchant.id,
            merchantName: merchant.name,
            approvalStatus: merchant.approvalStatus,
            // Documentation — estado "cumplido" (incluye los no requeridos)
            hasCuit,
            hasBankAccount,
            hasConstanciaAfip,
            hasHabilitacion,
            hasRegistroSanitario,
            isFoodBusiness,
            docsComplete,
            // Qué documentos son requeridos hoy (categoría + flags OPS). El
            // checklist usa esto para mostrar sólo los que se piden.
            cuitRequired,
            bankAccountRequired,
            constanciaAfipRequired,
            habilitacionRequired,
            registroSanitarioRequired,
            // Operational
            hasLogo,
            hasSchedule,
            hasProducts,
            productCount,
            hasAddress,
            hasMercadoPago,
            // Overall
            canOpenStore,
            isComplete,
        });
    } catch (error) {
        console.error("Error fetching onboarding status:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
