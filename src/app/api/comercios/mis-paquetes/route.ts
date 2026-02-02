import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener paquetes (categorías) adquiridos por el comercio
// Infiere categorías desde los productos que el comercio ya tiene
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Obtener el merchant del usuario
        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id }
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        // Fetch categories directly from MerchantCategory
        const ownedMerchantCategories = await prisma.merchantCategory.findMany({
            where: { merchantId: merchant.id },
            include: {
                category: {
                    include: {
                        _count: {
                            select: { products: true }
                        }
                    }
                }
            }
        });

        // Fetch categories where the merchant has acquired specific products
        const acquiredProducts = await prisma.merchantAcquiredProduct.findMany({
            where: { merchantId: merchant.id },
            include: {
                product: {
                    include: {
                        categories: {
                            include: {
                                category: {
                                    include: {
                                        _count: {
                                            select: { products: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Merge categories
        const categoryMap = new Map();

        ownedMerchantCategories.forEach(mc => {
            categoryMap.set(mc.category.id, {
                ...mc.category,
                isFullPackage: true
            });
        });

        acquiredProducts.forEach((ap: any) => {
            ap.product.categories.forEach((pc: any) => {
                if (!categoryMap.has(pc.category.id)) {
                    categoryMap.set(pc.category.id, {
                        ...pc.category,
                        isFullPackage: false
                    });
                }
            });
        });

        // Convert to response format
        const packages = Array.from(categoryMap.values()).map(cat => {
            return {
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                image: cat.image,
                totalProducts: cat._count.products,
                isFullPackage: cat.isFullPackage,
                // These stats are now less relevant since they are not automatically imported,
                // but kept for compatibility with UI if needed.
                activeProducts: 0,
                inactiveProducts: cat._count.products
            };
        });


        return NextResponse.json(packages);

    } catch (error) {
        console.error("Error fetching merchant packages:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
