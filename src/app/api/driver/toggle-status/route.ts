import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { isOnline } = await request.json();

        const driver = await prisma.driver.update({
            where: { userId: session.user.id },
            data: {
                isOnline: !!isOnline,
                availabilityStatus: isOnline ? "DISPONIBLE" : "FUERA_DE_SERVICIO"
            }
        });

        return NextResponse.json({
            success: true,
            isOnline: driver.isOnline,
            status: driver.availabilityStatus
        });
    } catch (error) {
        console.error("Error toggling driver status:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
