import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const merchantId = (session?.user as any)?.merchantId;
        if (!merchantId) {
            return NextResponse.json({ error: "Merchant no asociado" }, { status: 401 });
        }

        const { productIds, categoryId } = await request.json();

        // Determine which master product IDs to import
        let targetIds: string[] = [];

        if (categoryId) {
            // Find all master products in this category
            const masterProducts = await prisma.product.findMany({
                where: {
                    merchantId: null,
                    categories: { some: { categoryId } },
                },
                select: { id: true },
            });
            targetIds = masterProducts.map(p => p.id);
        } else if (productIds && Array.isArray(productIds) && productIds.length > 0) {
            targetIds = productIds;
        } else {
            return NextResponse.json({ error: "categoryId o productIds requeridos" }, { status: 400 });
        }

        if (targetIds.length === 0) {
            return NextResponse.json({ success: true, imported: 0 });
        }

        // Fetch master products with their images and categories
        const masterProducts = await prisma.product.findMany({
            where: {
                id: { in: targetIds },
                merchantId: null,
            },
            include: {
                categories: true,
                images: true,
            },
        });

        if (masterProducts.length === 0) {
            return NextResponse.json({ success: true, imported: 0 });
        }

        let count = 0;
        await prisma.$transaction(async (tx) => {
            for (const master of masterProducts) {
                const newSlug = `${master.slug}-${merchantId.substring(0, 5)}`;

                // Skip if already imported
                const existing = await tx.product.findFirst({
                    where: {
                        OR: [
                            { slug: newSlug },
                            { name: master.name, merchantId },
                        ],
                    },
                });
                if (existing) continue;

                await tx.product.create({
                    data: {
                        name: master.name,
                        slug: newSlug,
                        description: master.description,
                        price: master.price,
                        costPrice: master.costPrice,
                        stock: 100,
                        isActive: true,
                        merchantId,
                        images: {
                            create: master.images.map(img => ({
                                url: img.url,
                                alt: img.alt,
                                order: img.order,
                            })),
                        },
                        categories: {
                            create: master.categories.map(cat => ({
                                categoryId: cat.categoryId,
                            })),
                        },
                    },
                });
                count++;
            }
        });

        return NextResponse.json({ success: true, imported: count });
    } catch (error) {
        console.error("Error importing products:", error);
        return NextResponse.json({ error: "Error interno al importar" }, { status: 500 });
    }
}
