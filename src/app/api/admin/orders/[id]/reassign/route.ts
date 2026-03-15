import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { driverId } = body;

        if (!driverId || typeof driverId !== "string") {
            return NextResponse.json(
                { error: "driverId es requerido" },
                { status: 400 }
            );
        }

        // Verify driver exists
        const driver = await prisma.driver.findUnique({
            where: { id: driverId }
        });

        if (!driver) {
            return NextResponse.json(
                { error: "Repartidor no encontrado" },
                { status: 404 }
            );
        }

        // Update order with new driver
        const updatedOrder = await prisma.order.update({
            where: { id: params.id },
            data: { driverId },
            include: {
                items: true,
                address: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                driver: {
                    include: {
                        user: { select: { name: true } }
                    }
                },
                merchant: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("Error reassigning order:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
