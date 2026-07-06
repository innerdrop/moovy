// API Route: Seller Availability Management
// GET  - Returns current availability status
// POST - Update availability (online/offline/pause/prepTime/schedule)
// fix/seller-api-db-auth: auth contra DB (requireSellerApi), no contra el JWT
// cache — un seller suspendido/desactivado con sesión viva ya no puede operar.
import { NextResponse } from "next/server";
import { requireSellerApi } from "@/lib/seller-auth";
import {
    getSellerStatus,
    setSellerOnline,
    setSellerOffline,
    pauseSeller,
    updatePreparationMinutes,
    updateSchedule,
} from "@/lib/seller-availability";

export async function GET() {
    try {
        const authResult = await requireSellerApi();
        if (authResult instanceof NextResponse) return authResult;
        const { userId, sellerId } = authResult;

        const status = await getSellerStatus(userId);

        return NextResponse.json({ ...status, sellerId });
    } catch (error) {
        console.error("Error getting seller availability:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authResult = await requireSellerApi();
        if (authResult instanceof NextResponse) return authResult;
        const { userId } = authResult;

        const body = await request.json();
        const { action, pauseMinutes, preparationMinutes: prepMinutes, scheduleEnabled, scheduleJson } = body;

        let status;

        switch (action) {
            case "online":
                status = await setSellerOnline(userId);
                break;
            case "offline":
                status = await setSellerOffline(userId);
                break;
            case "pause":
                if (![15, 30, 60].includes(pauseMinutes)) {
                    return NextResponse.json(
                        { error: "pauseMinutes debe ser 15, 30 o 60" },
                        { status: 400 }
                    );
                }
                status = await pauseSeller(userId, pauseMinutes);
                break;
            case "prepTime":
                if (![5, 10, 15, 30].includes(prepMinutes)) {
                    return NextResponse.json(
                        { error: "preparationMinutes debe ser 5, 10, 15 o 30" },
                        { status: 400 }
                    );
                }
                status = await updatePreparationMinutes(userId, prepMinutes);
                break;
            case "schedule":
                status = await updateSchedule(
                    userId,
                    !!scheduleEnabled,
                    scheduleJson || null
                );
                break;
            default:
                return NextResponse.json(
                    { error: "Acción no válida. Use: online, offline, pause, prepTime, schedule" },
                    { status: 400 }
                );
        }

        return NextResponse.json(status);
    } catch (error) {
        console.error("Error updating seller availability:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
