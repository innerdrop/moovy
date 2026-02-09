import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Count drivers who are online and available
        const activeDriversCount = await prisma.driver.count({
            where: {
                isOnline: true,
                availabilityStatus: "DISPONIBLE"
            }
        });

        return NextResponse.json({
            availableDrivers: activeDriversCount,
            hasDrivers: activeDriversCount > 0
        });
    } catch (error) {
        console.error("[Driver Availability] Error:", error);
        return NextResponse.json({ error: "Error checking driver availability" }, { status: 500 });
    }
}
