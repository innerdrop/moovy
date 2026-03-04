import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Activate SELLER role for authenticated user
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Check if already a seller
        const existingRole = await prisma.userRole.findUnique({
            where: { userId_role: { userId, role: "SELLER" } }
        });
        if (existingRole) {
            return NextResponse.json(
                { error: "Ya tenés el rol de vendedor" },
                { status: 409 }
            );
        }

        // Create seller role
        await prisma.userRole.create({
            data: { userId, role: "SELLER", isActive: true }
        });

        return NextResponse.json({ success: true, role: "SELLER", status: "ACTIVE" });
    } catch (error) {
        console.error("Error activating seller:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
