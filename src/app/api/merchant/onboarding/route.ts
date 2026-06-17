// API Route: Get merchant onboarding status
import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

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

        // Food businesses require sanitary registration
        const FOOD_TYPES = ["Restaurante", "Pizzería", "Hamburguesería", "Parrilla", "Cafetería",
            "Heladería", "Panadería/Pastelería", "Sushi", "Comida Saludable", "Rotisería", "Bebidas", "Vinoteca/Licorería"];
        const isFoodBusiness = FOOD_TYPES.includes(merchant.category || "");

        // Get product count
        const productCount = await prisma.product.count({
            where: { merchantId: merchant.id, isActive: true },
        });

        // Required documentation checks — un doc se considera "cumplido" cuando
        // está APPROVED, sin importar si la aprobación fue DIGITAL (con URL en
        // el sistema) o PHYSICAL (admin recibió el papel y aprobó manualmente).
        // Antes chequeábamos `Boolean(merchant.cuit)` etc., lo que excluía las
        // aprobaciones físicas y dejaba el checklist marcando "falta" indefinidamente.
        const hasCuit = merchant.cuitStatus === "APPROVED";
        const hasBankAccount = merchant.bankAccountStatus === "APPROVED";
        const hasConstanciaAfip = merchant.constanciaAfipStatus === "APPROVED";
        const hasHabilitacion = merchant.habilitacionMunicipalStatus === "APPROVED";
        const hasRegistroSanitario = !isFoodBusiness || merchant.registroSanitarioStatus === "APPROVED";

        // Operational checks
        const hasLogo = Boolean(merchant.image);
        const hasSchedule = Boolean(merchant.scheduleJson);
        const hasProducts = productCount >= 1;
        const hasAddress = Boolean(merchant.address && merchant.latitude);
        const hasMercadoPago = Boolean(merchant.mpUserId);

        // All docs complete = can open store
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
            // Documentation
            hasCuit,
            hasBankAccount,
            hasConstanciaAfip,
            hasHabilitacion,
            hasRegistroSanitario,
            isFoodBusiness,
            docsComplete,
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
