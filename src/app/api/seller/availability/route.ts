// API Route: Seller Availability Management
// GET  - Returns current availability status
// POST - Update availability (online/offline/pause/prepTime/schedule)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["SELLER"])) {
            return NextResponse.json({ error: "Solo vendedores" }, { status: 403 });
        }

        const status = await getSellerStatus(session.user.id);

        // Include sellerProfile id for use by other features (e.g. reviews)
        const sellerProfile = await (await import("@/lib/prisma")).prisma.sellerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });

        return NextResponse.json({ ...status, sellerId: sellerProfile?.id || null });
    } catch (error) {
        console.error("Error getting seller availability:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["SELLER"])) {
            return NextResponse.json({ error: "Solo vendedores" }, { status: 403 });
        }

        const body = await request.json();
        const { action, pauseMinutes, preparationMinutes: prepMinutes, scheduleEnabled, scheduleJson } = body;

        let status;

        switch (action) {
            case "online":
                status = await setSellerOnline(session.user.id);
                break;
            case "offline":
                status = await setSellerOffline(session.user.id);
                break;
            case "pause":
                if (![15, 30, 60].includes(pauseMinutes)) {
                    return NextResponse.json(
                        { error: "pauseMinutes debe ser 15, 30 o 60" },
                        { status: 400 }
                    );
                }
                status = await pauseSeller(session.user.id, pauseMinutes);
                break;
            case "prepTime":
                if (![5, 10, 15, 30].includes(prepMinutes)) {
                    return NextResponse.json(
                        { error: "preparationMinutes debe ser 5, 10, 15 o 30" },
                        { status: 400 }
                    );
                }
                status = await updatePreparationMinutes(session.user.id, prepMinutes);
                break;
            case "schedule":
                status = await updateSchedule(
                    session.user.id,
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
