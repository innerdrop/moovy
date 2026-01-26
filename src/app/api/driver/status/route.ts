// API Route: Update driver availability status
// PUT /api/driver/status { status: "DISPONIBLE" | "OCUPADO" | "FUERA_DE_SERVICIO" }
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["DISPONIBLE", "OCUPADO", "FUERA_DE_SERVICIO"];

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== "DRIVER") {
            return NextResponse.json({ error: "Solo repartidores" }, { status: 403 });
        }

        const { status } = await request.json();

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Estado inválido. Valores válidos: ${VALID_STATUSES.join(", ")}` },
                { status: 400 }
            );
        }

        const driver = await prisma.driver.update({
            where: { userId: session.user.id },
            data: {
                availabilityStatus: status,
                isOnline: status !== "FUERA_DE_SERVICIO",
            },
            select: {
                id: true,
                availabilityStatus: true,
                isOnline: true,
            },
        });

        return NextResponse.json({
            success: true,
            status: driver.availabilityStatus,
            isOnline: driver.isOnline,
        });
    } catch (error) {
        console.error("Error updating driver status:", error);
        return NextResponse.json(
            { error: "Error al actualizar estado" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: {
                id: true,
                availabilityStatus: true,
                isOnline: true,
                latitude: true,
                longitude: true,
                lastLocationAt: true,
            },
        });

        if (!driver) {
            return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
        }

        return NextResponse.json(driver);
    } catch (error) {
        console.error("Error getting driver status:", error);
        return NextResponse.json(
            { error: "Error al obtener estado" },
            { status: 500 }
        );
    }
}
