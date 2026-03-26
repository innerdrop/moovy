import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const toggleStatusSchema = z.object({
    isOnline: z.boolean(),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER"])) {
            return NextResponse.json({ error: "Solo repartidores pueden cambiar su estado" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = toggleStatusSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Campo isOnline (boolean) es requerido" },
                { status: 400 }
            );
        }

        const { isOnline } = parsed.data;

        // Verify driver exists and is approved before allowing status toggle
        const existingDriver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: { id: true, approvalStatus: true, isActive: true },
        });

        if (!existingDriver) {
            return NextResponse.json({ error: "Perfil de repartidor no encontrado" }, { status: 404 });
        }

        if (existingDriver.approvalStatus !== "APPROVED") {
            return NextResponse.json(
                { error: "Tu solicitud está pendiente de aprobación. No podés conectarte hasta ser aprobado." },
                { status: 403 }
            );
        }

        if (!existingDriver.isActive) {
            return NextResponse.json(
                { error: "Tu cuenta de repartidor está desactivada. Contactá a soporte." },
                { status: 403 }
            );
        }

        const driver = await prisma.driver.update({
            where: { id: existingDriver.id },
            data: {
                isOnline,
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
