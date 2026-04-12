// API Route: Get merchant onboarding status
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            select: {
                id: true,
                name: true,
                image: true,
                scheduleJson: true,
                approvalStatus: true,
                cuit: true,
                bankAccount: true,
                constanciaAfipUrl: true,
                habilitacionMunicipalUrl: true,
                registroSanitarioUrl: true,
                category: true,
                address: true,
                latitude: true,
                mpUserId: true,
                mpEmail: true,
            },
        });

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

        // Required documentation checks
        const hasCuit = Boolean(merchant.cuit);
        const hasBankAccount = Boolean(merchant.bankAccount);
        const hasConstanciaAfip = Boolean(merchant.constanciaAfipUrl);
        const hasHabilitacion = Boolean(merchant.habilitacionMunicipalUrl);
        const hasRegistroSanitario = !isFoodBusiness || Boolean(merchant.registroSanitarioUrl);

        // Operational checks
        const hasLogo = Boolean(merchant.image);
        const hasSchedule = Boolean(merchant.scheduleJson);
        const hasProducts = productCount >= 1;
        const hasAddress = Boolean(merchant.address && merchant.latitude);
        const hasMercadoPago = Boolean(merchant.mpUserId);

        // All docs complete = can open store
        const docsComplete = hasCuit && hasBankAccount && hasConstanciaAfip && hasHabilitacion && hasRegistroSanitario;
        // All operational = fully ready
        const canOpenStore = docsComplete && hasSchedule && hasProducts && hasAddress;
        const isComplete = canOpenStore && hasLogo && hasMercadoPago;

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
