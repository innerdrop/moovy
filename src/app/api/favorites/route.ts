// API Route: Favorites — GET, POST, DELETE
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["merchant", "product", "listing"] as const;
type FavoriteType = (typeof VALID_TYPES)[number];

function getFieldName(type: FavoriteType): "merchantId" | "productId" | "listingId" {
    return `${type}Id` as "merchantId" | "productId" | "listingId";
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get("type") as FavoriteType | null;

        const where: any = { userId: session.user.id };

        if (typeFilter && VALID_TYPES.includes(typeFilter)) {
            where[getFieldName(typeFilter)] = { not: null };
        }

        const favorites = await prisma.favorite.findMany({
            where,
            include: {
                merchant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        image: true,
                        rating: true,
                        isOpen: true,
                        isActive: true,
                        deliveryTimeMin: true,
                        deliveryTimeMax: true,
                        deliveryFee: true,
                        address: true,
                        isVerified: true,
                        isPremium: true,
                        premiumTier: true,
                        description: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        isActive: true,
                        isFeatured: true,
                        merchantId: true,
                        merchant: {
                            select: { isOpen: true, name: true, slug: true },
                        },
                        images: {
                            select: { url: true },
                            orderBy: { order: "asc" },
                            take: 1,
                        },
                    },
                },
                listing: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        condition: true,
                        isActive: true,
                        sellerId: true,
                        seller: {
                            select: {
                                id: true,
                                displayName: true,
                                avatar: true,
                                rating: true,
                            },
                        },
                        images: {
                            select: { url: true },
                            orderBy: { order: "asc" },
                            take: 1,
                        },
                        category: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Group by type for easier frontend consumption
        const merchants = favorites.filter(f => f.merchantId).map(f => ({ favoriteId: f.id, ...f.merchant! }));
        const products = favorites.filter(f => f.productId).map(f => ({ favoriteId: f.id, ...f.product! }));
        const listings = favorites.filter(f => f.listingId).map(f => ({ favoriteId: f.id, ...f.listing! }));

        // Also return flat ID arrays for the store
        const merchantIds = favorites.filter(f => f.merchantId).map(f => f.merchantId!);
        const productIds = favorites.filter(f => f.productId).map(f => f.productId!);
        const listingIds = favorites.filter(f => f.listingId).map(f => f.listingId!);

        return NextResponse.json({
            merchants,
            products,
            listings,
            ids: { merchantIds, productIds, listingIds },
        });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return NextResponse.json({ error: "Error al obtener favoritos" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { type, itemId } = await request.json();

        if (!type || !itemId || !VALID_TYPES.includes(type)) {
            return NextResponse.json({ error: "Tipo o ID inválido" }, { status: 400 });
        }

        const fieldName = getFieldName(type as FavoriteType);

        const favorite = await prisma.favorite.create({
            data: {
                userId: session.user.id,
                [fieldName]: itemId,
            },
        }).catch((err: any) => {
            // Handle unique constraint violation — already favorited
            if (err.code === "P2002") {
                return null;
            }
            throw err;
        });

        if (!favorite) {
            // Already exists, return existing
            const existing = await prisma.favorite.findFirst({
                where: { userId: session.user.id, [fieldName]: itemId },
            });
            return NextResponse.json({ success: true, favorite: existing });
        }

        return NextResponse.json({ success: true, favorite }, { status: 201 });
    } catch (error) {
        console.error("Error adding favorite:", error);
        return NextResponse.json({ error: "Error al agregar favorito" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { type, itemId } = await request.json();

        if (!type || !itemId || !VALID_TYPES.includes(type)) {
            return NextResponse.json({ error: "Tipo o ID inválido" }, { status: 400 });
        }

        const fieldName = getFieldName(type as FavoriteType);

        await prisma.favorite.deleteMany({
            where: {
                userId: session.user.id,
                [fieldName]: itemId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing favorite:", error);
        return NextResponse.json({ error: "Error al quitar favorito" }, { status: 500 });
    }
}
