import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Public listing of active listings with filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        const condition = searchParams.get("condition");
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        const where: any = { isActive: true };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (condition) {
            where.condition = condition;
        }

        if (search) {
            where.title = {
                contains: search,
                mode: "insensitive",
            };
        }

        const [listings, total] = await Promise.all([
            prisma.listing.findMany({
                where,
                include: {
                    seller: {
                        select: {
                            id: true,
                            displayName: true,
                            rating: true,
                            avatar: true,
                        },
                    },
                    images: { orderBy: { order: "asc" } },
                    category: { select: { id: true, name: true, slug: true } },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.listing.count({ where }),
        ]);

        return NextResponse.json({ listings, total });
    } catch (error) {
        console.error("Error fetching listings:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
