import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { getPendingDriverPayouts, getPendingMerchantPayouts } from "@/lib/payouts";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/payouts/pending?type=DRIVER|MERCHANT
 * Devuelve saldos pendientes agrupados por recipient.
 */
export async function GET(request: NextRequest) {
    const limited = await applyRateLimit(request, "admin:payouts-pending", 30, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") as "DRIVER" | "MERCHANT" | null;
    if (!type || (type !== "DRIVER" && type !== "MERCHANT")) {
        return NextResponse.json({ error: "type debe ser DRIVER o MERCHANT" }, { status: 400 });
    }

    try {
        const items = type === "DRIVER"
            ? await getPendingDriverPayouts()
            : await getPendingMerchantPayouts();

        const total = items.reduce((sum, i) => sum + i.totalAmount, 0);
        const orderCount = items.reduce((sum, i) => sum + i.orderCount, 0);

        return NextResponse.json({
            ok: true,
            type,
            items,
            totals: {
                recipients: items.length,
                orders: orderCount,
                amount: Math.round(total * 100) / 100,
            },
        });
    } catch (error) {
        logger.error({ error, type }, "[admin/payouts/pending] error");
        return NextResponse.json({ error: "Error calculando pagos pendientes" }, { status: 500 });
    }
}
