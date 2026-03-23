// API: Get support status (public - no auth required)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Check if any operator is online and active
        const activeOperator = await (prisma as any).supportOperator.findFirst({
            where: {
                isActive: true,
                isOnline: true
            }
        });

        return NextResponse.json({
            isOnline: !!activeOperator,
            message: activeOperator ? "Estamos en línea" : "Estamos fuera de línea"
        });
    } catch (error) {
        console.error("Error checking support status:", error);
        return NextResponse.json({
            isOnline: false,
            message: "No disponible"
        });
    }
}
