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

        // SECURITY: Verify merchant has purchased this package/products
        if (categoryId) {
            const hasPurchase = await prisma.packagePurchase.findFirst({
                where: {
                    merchantId,
                    categoryId,
                    paymentStatus: "approved",
                },
            });

            const hasCategory = await prisma.merchantCategory.findFirst({
                where: { merchantId, categoryId },
            });

            if (!hasPurchase && !hasCategory) {
                return NextResponse.json(
                    { error: "No tenés acceso a este paquete. Primero debés adquirirlo." },
                    { status: 403 }
                );
            }
        } else if (productIds && Array.isArray(productIds) && productIds.length > 0) {
            // Check if merchant acquired these products individually
            const acquiredProducts = await prisma.merchantAcquiredProduct.findMany({
                where: { merchantId, productId: { in: productIds } },
                select: { productId: true },
            });

            const acquiredIds = new Set(acquiredProducts.map(p => p.productId));

            // Also check if products belong to a purchased category
            const purchasedCategories = await prisma.merchantCategory.findMany({
                where: { merchantId },
                select: { categoryId: true },
            });
            const catIds = purchasedCategories.map(c => c.categoryId);

            if (catIds.length > 0) {
                const productsInOwnedCats = await prisma.product.findMany({
                    where: {
                        id: { in: productIds },
                        merchantId: null,
                        categories: { some: { categoryId: { in: catIds } } },
                    },
                    select: { id: true },
                });
                productsInOwnedCats.forEach(p => acquiredIds.add(p.id));
            }

            const unauthorizedIds = productIds.filter((id: string) => !acquiredIds.has(id));
            if (unauthorizedIds.length > 0) {
                return NextResponse.json(
                    { error: `No tenés acceso a ${unauthorizedIds.length} producto(s). Adquirilos primero.` },
                    { status: 403 }
                );
            }
        } else {
            return NextResponse.json({ error: "categoryId o productIds requeridos" }, { status: 400 });
        }

        // Determine which master products to import
        let targetIds: string[] = [];

        if (categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
                include: { children: { select: { id: true } } },
            });

            const allCatIds = [categoryId];
            if (category?.children) {
                allCatIds.push(...category.children.map(c => c.id));
            }

            const masterProducts = await prisma.product.findMany({
                where: {
                    merchantId: null,
                    isActive: true,
                    categories: { some: { categoryId: { in: allCatIds } } },
                },
                select: { id: true },
            });
            targetIds = masterProducts.map(p => p.id);
        } else {
            targetIds = productIds;
        }

        if (targetIds.length === 0) {
            return NextResponse.json({ success: true, imported: 0 });
        }

        // Fetch master products with images and categories
        const masterProducts = await prisma.product.findMany({
            where: { id: { in: targetIds }, merchantId: null },
            include: { categories: true, images: true },
        });

        let count = 0;
        await prisma.$transaction(async (tx) => {
            for (const master of masterProducts) {
                const newSlug = `${master.slug}-${merchantId.substring(0, 5)}`;

                // Skip if already imported
                const existing = await tx.product.findFirst({
                    where: { OR: [{ slug: newSlug }, { name: master.name, merchantId }] },
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
