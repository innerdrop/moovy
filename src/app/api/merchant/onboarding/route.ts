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
            },
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        // Get product count
        const productCount = await prisma.product.count({
            where: { merchantId: merchant.id, isActive: true },
        });

        // Check onboarding status
        const hasLogo = Boolean(merchant.image);
        const hasSchedule = Boolean(merchant.scheduleJson);
        const hasProducts = productCount >= 3;
        const hasDeliverySettings = true; // These are always set at registration (default values)

        const isComplete = hasLogo && hasSchedule && hasProducts && hasDeliverySettings;

        return NextResponse.json({
            merchantId: merchant.id,
            merchantName: merchant.name,
            approvalStatus: merchant.approvalStatus,
            hasLogo,
            hasSchedule,
            hasProducts,
            productCount,
            hasDeliverySettings,
            isComplete,
        });
    } catch (error) {
        console.error("Error fetching onboarding status:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
