// API Route: Reorder categories
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Reorder categories
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { categoryIds } = await request.json();

        if (!Array.isArray(categoryIds)) {
            return NextResponse.json({ error: "categoryIds debe ser un array" }, { status: 400 });
        }

        // Update order for each category
        await Promise.all(
            categoryIds.map((id: string, index: number) =>
                prisma.category.update({
                    where: { id },
                    data: { order: index },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering categories:", error);
        return NextResponse.json({ error: "Error al reordenar categorías" }, { status: 500 });
    }
}
