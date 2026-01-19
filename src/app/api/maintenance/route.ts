import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
            select: {
                isMaintenanceMode: true,
                maintenanceMessage: true,
            },
        });

        return NextResponse.json({
            isMaintenanceMode: settings?.isMaintenanceMode ?? false,
            maintenanceMessage: settings?.maintenanceMessage ?? "¡Volvemos pronto!",
        });
    } catch (error) {
        return NextResponse.json({
            isMaintenanceMode: false,
            maintenanceMessage: "",
        });
    }
}
