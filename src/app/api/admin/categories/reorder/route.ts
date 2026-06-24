// API Route: Reorder categories
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// POST - Reorder categories
export async function POST(request: Request) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

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
