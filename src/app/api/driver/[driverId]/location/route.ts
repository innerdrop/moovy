import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/driver/[driverId]/location
 * Returns the current location of a driver (for customer tracking polling)
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ driverId: string }> }
) {
    try {
        const { driverId } = await context.params;
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: {
                id: true,
                latitude: true,
                longitude: true,
                updatedAt: true,
            }
        });

        if (!driver) {
            return NextResponse.json(
                { error: "Driver not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            driverId: driver.id,
            latitude: driver.latitude,
            longitude: driver.longitude,
            updatedAt: driver.updatedAt
        });
    } catch (error) {
        console.error("Error fetching driver location:", error);
        return NextResponse.json(
            { error: "Error fetching driver location" },
            { status: 500 }
        );
    }
}
