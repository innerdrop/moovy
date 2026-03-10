import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Public categories (lightweight, no auth required)
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true },
            orderBy: { order: "asc" },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching public categories:", error);
        return NextResponse.json([], { status: 500 });
    }
}
