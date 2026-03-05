// Admin Sellers API - List SellerProfiles
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");
    const isVerified = searchParams.get("isVerified");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {};

    // Status filter (convenience param)
    if (status === "verified") where.isVerified = true;
    else if (status === "pending") where.isVerified = false;
    else if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;

    // Direct boolean filters
    if (isActive !== null && isActive !== "") where.isActive = isActive === "true";
    if (isVerified !== null && isVerified !== "") where.isVerified = isVerified === "true";

    // Search filter
    if (search) {
        where.OR = [
            { displayName: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
        ];
    }

    try {
        const sellers = await prisma.sellerProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                _count: {
                    select: {
                        listings: true,
                        subOrders: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(sellers);
    } catch (error) {
        console.error("Error fetching sellers:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
