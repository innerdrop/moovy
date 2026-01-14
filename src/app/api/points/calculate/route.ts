// API Route: Calculate Points Discount
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserPointsBalance, getPointsConfig, calculateMaxPointsDiscount } from "@/lib/points";

// POST - Calculate how many points can be used for a given order total
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { orderTotal } = await request.json();

        if (!orderTotal || orderTotal <= 0) {
            return NextResponse.json({ error: "Total de pedido inválido" }, { status: 400 });
        }

        const balance = await getUserPointsBalance(session.user.id);
        const config = await getPointsConfig();
        const result = calculateMaxPointsDiscount(orderTotal, balance, config);

        return NextResponse.json({
            currentBalance: balance,
            orderTotal,
            pointsUsable: result.pointsUsable,
            discountAmount: result.discountAmount,
            minPointsToRedeem: config.minPointsToRedeem,
            canUsePoints: balance >= config.minPointsToRedeem,
        });
    } catch (error) {
        console.error("Error calculating points:", error);
        return NextResponse.json({ error: "Error al calcular puntos" }, { status: 500 });
    }
}

