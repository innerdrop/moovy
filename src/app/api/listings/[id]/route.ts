import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Public listing detail
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const listing = await prisma.listing.findUnique({
            where: { id },
            include: {
                seller: {
                    select: {
                        id: true,
                        displayName: true,
                        bio: true,
                        avatar: true,
                        rating: true,
                        totalSales: true,
                    },
                },
                images: { orderBy: { order: "asc" } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        if (!listing || !listing.isActive) {
            return NextResponse.json(
                { error: "Listing no encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json(listing);
    } catch (error) {
        console.error("Error fetching listing:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
