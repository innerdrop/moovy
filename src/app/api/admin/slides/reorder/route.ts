// API Route: Reorder slides
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// POST - Reorder slides
export async function POST(request: Request) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { slideIds } = await request.json();

        if (!Array.isArray(slideIds)) {
            return NextResponse.json({ error: "slideIds debe ser un array" }, { status: 400 });
        }

        // Update order for each slide
        await Promise.all(
            slideIds.map((id: string, index: number) =>
                prisma.heroSlide.update({
                    where: { id },
                    data: { order: index },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering slides:", error);
        return NextResponse.json({ error: "Error al reordenar slides" }, { status: 500 });
    }
}
