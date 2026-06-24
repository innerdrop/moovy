import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET — Admin ve todas las solicitudes de publicidad
export async function GET(request: NextRequest) {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (status) {
        where.status = status;
    }

    const [placements, total] = await Promise.all([
        prisma.adPlacement.findMany({
            where,
            include: {
                merchant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        image: true,
                        isPremium: true,
                        premiumTier: true,
                        premiumUntil: true,
                        phone: true,
                        email: true,
                        whatsappNumber: true,
                    },
                },
            },
            orderBy: [
                { status: "asc" },
                { createdAt: "desc" },
            ],
            take: limit,
            skip: (page - 1) * limit,
        }),
        prisma.adPlacement.count({ where }),
    ]);

    return NextResponse.json({
        placements,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
}
