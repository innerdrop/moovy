import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Public categories with counts (lightweight, no auth required)
// ?scope=STORE | MARKETPLACE | BOTH (default: returns all active)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const scope = searchParams.get("scope"); // STORE, MARKETPLACE, or null

        // Build where clause based on scope
        const where: any = { isActive: true };

        if (scope === "MARKETPLACE") {
            where.scope = { in: ["MARKETPLACE", "BOTH"] };
        } else if (scope === "STORE") {
            where.scope = { in: ["STORE", "BOTH"] };
        }
        // No scope param = return all active (backward compatible)

        const categories = await prisma.category.findMany({
            where,
            select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                icon: true,
                scope: true,
                _count: {
                    select: {
                        listings: { where: { isActive: true } },
                        products: true,
                    },
                },
            },
            orderBy: { order: "asc" },
        });

        // Flatten _count into readable fields
        const result = categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            image: cat.image,
            icon: cat.icon,
            scope: cat.scope,
            listingCount: cat._count.listings,
            productCount: cat._count.products,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching public categories:", error);
        return NextResponse.json([], { status: 500 });
    }
}
