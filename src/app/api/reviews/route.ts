import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

// GET /api/reviews?type=merchant&id=xxx  or  type=seller&id=xxx  or  type=driver&id=xxx
export async function GET(request: NextRequest) {
    const limited = applyRateLimit(request, "reviews:list", 20, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get("type");
    const id = request.nextUrl.searchParams.get("id");

    if (!type || !id) {
        return NextResponse.json({ error: "type e id requeridos" }, { status: 400 });
    }

    try {
        if (type === "merchant") {
            const reviews = await prisma.order.findMany({
                where: { merchantId: id, merchantRating: { not: null } },
                select: {
                    id: true,
                    orderNumber: true,
                    merchantRating: true,
                    merchantRatingComment: true,
                    createdAt: true,
                    user: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 50,
            });

            return NextResponse.json(
                reviews.map((r) => ({
                    id: r.id,
                    orderNumber: r.orderNumber,
                    rating: r.merchantRating,
                    comment: r.merchantRatingComment,
                    date: r.createdAt,
                    userName: r.user?.name || "Cliente",
                }))
            );
        }

        if (type === "seller") {
            const reviews = await prisma.order.findMany({
                where: {
                    subOrders: { some: { sellerId: id } },
                    sellerRating: { not: null },
                },
                select: {
                    id: true,
                    orderNumber: true,
                    sellerRating: true,
                    sellerRatingComment: true,
                    createdAt: true,
                    user: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 50,
            });

            return NextResponse.json(
                reviews.map((r) => ({
                    id: r.id,
                    orderNumber: r.orderNumber,
                    rating: r.sellerRating,
                    comment: r.sellerRatingComment,
                    date: r.createdAt,
                    userName: r.user?.name || "Cliente",
                }))
            );
        }

        if (type === "driver") {
            const reviews = await prisma.order.findMany({
                where: { driverId: id, driverRating: { not: null } },
                select: {
                    id: true,
                    orderNumber: true,
                    driverRating: true,
                    ratingComment: true,
                    createdAt: true,
                    user: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 50,
            });

            return NextResponse.json(
                reviews.map((r) => ({
                    id: r.id,
                    orderNumber: r.orderNumber,
                    rating: r.driverRating,
                    comment: r.ratingComment,
                    date: r.createdAt,
                    userName: r.user?.name || "Cliente",
                }))
            );
        }

        return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
    } catch (error) {
        console.error("Reviews error:", error);
        return NextResponse.json({ error: "Error al obtener reseñas" }, { status: 500 });
    }
}
