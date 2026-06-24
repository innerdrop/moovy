// Admin Listings API - List all Listings for moderation
import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");
    const condition = searchParams.get("condition");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    // Siempre filtrar soft-deleted (listings eliminados por OPS no vuelven a aparecer)
    const where: any = { deletedAt: null };

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
                images: { select: { url: true }, orderBy: { order: "asc" } },
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
