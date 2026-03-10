// Admin Listings API - List all Listings for moderation
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");
    const condition = searchParams.get("condition");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const where: any = {};

    // Status convenience filter
    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;

    // Direct filters
    if (isActive !== null && isActive !== "") where.isActive = isActive === "true";
    if (condition) where.condition = condition;
    if (categoryId) where.categoryId = categoryId;

    // Search
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { seller: { displayName: { contains: search, mode: "insensitive" } } },
        ];
    }

    try {
        const listings = await prisma.listing.findMany({
            where,
            include: {
                seller: {
                    select: {
                        id: true,
                        displayName: true,
                        isVerified: true,
                        user: { select: { email: true } },
                    },
                },
                images: { take: 1, select: { url: true } },
                category: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(listings);
    } catch (error) {
        console.error("Error fetching listings:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
