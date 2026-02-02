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

        // For individual products, we only record the acquisition
        // The merchant will then "import" them manually from the NewProductForm
        await prisma.$transaction(async (tx) => {
            for (const id of productIds) {
                await tx.merchantAcquiredProduct.upsert({
                    where: {
                        merchantId_productId: {
                            merchantId: merchantId,
                            productId: id
                        }
                    },
                    update: {},
                    create: {
                        merchantId: merchantId,
                        productId: id
                    }
                });
            }
        });

        return NextResponse.json({
            message: "Derechos de productos adquiridos con éxito",
            count: productIds.length,
            success: true
        });


    } catch (error) {
        console.error("Error importing products:", error);
        return NextResponse.json({ error: "Error interno al importar" }, { status: 500 });
    }
}
