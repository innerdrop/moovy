import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get current driver's online status
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: { isOnline: true, isActive: true }
        });

        if (!driver) {
            return NextResponse.json({ error: "No eres repartidor" }, { status: 404 });
        }

        return NextResponse.json(driver);
    } catch (error) {
        console.error("Error fetching driver status:", error);
        return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
}

// PATCH - Toggle online status
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { isOnline } = body;

        if (typeof isOnline !== "boolean") {
            return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id }
        });

        if (!driver) {
            return NextResponse.json({ error: "No eres repartidor" }, { status: 404 });
        }

        if (!driver.isActive) {
            return NextResponse.json({ error: "Tu cuenta está desactivada" }, { status: 403 });
        }

        const updatedDriver = await prisma.driver.update({
            where: { userId: session.user.id },
            data: { isOnline }
        });

        return NextResponse.json({
            isOnline: updatedDriver.isOnline,
            message: isOnline ? "Estás en línea" : "Estás fuera de línea"
        });
    } catch (error) {
        console.error("Error updating driver status:", error);
        return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
}
