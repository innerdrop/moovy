// API Route: Get current merchant info
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== "MERCHANT" && role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
            }
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        return NextResponse.json(merchant);
    } catch (error) {
        console.error("Error fetching merchant:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
