// API Route: Points Balance and History
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserPointsBalance, getPointsHistory, getPointsConfig, calculateMaxPointsDiscount } from "@/lib/points";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includeHistory = searchParams.get("history") === "true";
        const includeConfig = searchParams.get("config") === "true";

        const balance = await getUserPointsBalance(session.user.id);

        const response: any = {
            balance,
            formattedBalance: balance.toLocaleString("es-AR"),
        };

        if (includeHistory) {
            response.history = await getPointsHistory(session.user.id);
        }

        if (includeConfig) {
            const config = await getPointsConfig();
            response.config = {
                pointsValue: config.pointsValue,
                minPointsToRedeem: config.minPointsToRedeem,
                maxDiscountPercent: config.maxDiscountPercent,
            };
            // Calculate what can be redeemed in a sample $10000 order
            const redeemable = calculateMaxPointsDiscount(10000, balance, config);
            response.redeemableValue = redeemable.discountAmount;
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching points:", error);
        return NextResponse.json({ error: "Error al obtener puntos" }, { status: 500 });
    }
}

