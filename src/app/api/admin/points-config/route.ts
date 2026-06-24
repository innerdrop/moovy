import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireApiAdmin } from "@/lib/admin-auth";
import { getPointsConfig, updatePointsConfig } from "@/lib/points";

// GET - Retrieve current configuration
export async function GET(request: Request) {
    try {
        const session = await auth();
        // Allow ADMIN and MERCHANT (maybe merchant wants to see it)
        const role = (session?.user as any)?.role;
        if (role !== "ADMIN" && role !== "MERCHANT") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const config = await getPointsConfig();
        return NextResponse.json(config);
    } catch (error) {
        console.error("Error fetching points config:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// PUT - Update configuration (ADMIN ONLY)
export async function PUT(request: Request) {
    try {
        // Only ADMIN can change core loyalty rules (DB source of truth)
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const data = await request.json();

        // Validate / Clean data
        const cleanData = {
            pointsPerDollar: Number(data.pointsPerDollar),
            minPurchaseForPoints: Number(data.minPurchaseForPoints),
            pointsValue: Number(data.pointsValue),
            minPointsToRedeem: Number(data.minPointsToRedeem),
            maxDiscountPercent: Number(data.maxDiscountPercent),
            signupBonus: Number(data.signupBonus),
            referralBonus: Number(data.referralBonus),
            // chore/biblia-limpieza-fantasmas: reviewBonus removido (feature dormido)
        };

        const updated = await updatePointsConfig(cleanData);
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating points config:", error);
        return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 });
    }
}
