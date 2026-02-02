import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await auth();
        const merchantId = (session?.user as any)?.merchantId;

        if (!session || !merchantId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { productIds, categoryId } = await request.json();

        if (categoryId) {
            // Record category purchase/acquisition
            await prisma.merchantCategory.upsert({
                where: {
                    merchantId_categoryId: {
                        merchantId: merchantId,
                        categoryId: categoryId
                    }
                },
                update: {},
                create: {
                    merchantId: merchantId,
                    categoryId: categoryId
                }
            });

            return NextResponse.json({
                message: "Paquete adquirido con éxito",
                success: true
            });
        }

        if (!productIds || !Array.isArray(productIds)) {
            return NextResponse.json({ error: "IDs de productos o Categoría requeridos" }, { status: 400 });
        }

        // Fetch master products to clone
        const masterProducts = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                merchantId: null // Ensure we only clone master products
            },
            include: {
                categories: true,
                images: true
            }
        });

        const clonedProducts = [];

        // Transaction to ensure all or nothing
        await prisma.$transaction(async (tx) => {
            for (const master of masterProducts) {
                // Generate a unique slug for the merchant (merchantId + original slug)
                const newSlug = `${master.slug}-${merchantId.substring(0, 5)}`;

                // Check if already exists to avoid duplicates
                const existing = await tx.product.findFirst({
                    where: { slug: newSlug }
                });

                if (existing) continue;

                const newProduct = await tx.product.create({
                    data: {
                        name: master.name,
                        slug: newSlug,
                        description: master.description,
                        price: master.price,
                        costPrice: master.costPrice,
                        stock: 100, // Initial stock for merchant
                        isActive: true,
                        merchant: { connect: { id: merchantId } },
                        // Link existing images
                        images: {
                            create: master.images.map(img => ({
                                url: img.url,
                                alt: img.alt,
                                order: img.order
                            }))
                        },
                        // Connect to same categories
                        categories: {
                            create: master.categories.map(cat => ({
                                categoryId: cat.categoryId
                            }))
                        }
                    }
                });
                clonedProducts.push(newProduct);
            }
        });

        return NextResponse.json({
            message: "Productos importados con éxito",
            count: clonedProducts.length,
            success: true
        });


    } catch (error) {
        console.error("Error importing products:", error);
        return NextResponse.json({ error: "Error interno al importar" }, { status: 500 });
    }
}
