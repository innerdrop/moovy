import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Obtener productos del comercio en una categoría/paquete específico
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        const { id: categoryId } = await params;

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

        // 1. Obtener todos los productos MAESTROS de esta categoría
        const masterProducts = await prisma.product.findMany({
            where: {
                merchantId: null,
                isActive: true,
                categories: {
                    some: {
                        categoryId: categoryId
                    }
                }
            },
            include: {
                images: {
                    orderBy: { order: 'asc' },
                    take: 1
                }
            },
            orderBy: { name: 'asc' }
        });

        // 2. Obtener los productos que EL COMERCIO ya tiene en esta categoría
        const merchantProducts = await prisma.product.findMany({
            where: {
                merchantId: merchant.id,
                categories: {
                    some: {
                        categoryId: categoryId
                    }
                }
            },
            select: {
                id: true,
                name: true,
                isActive: true,
                stock: true,
                price: true
            }
        });

        // 3. Cruzar información
        const unifiedProducts = masterProducts.map(master => {
            // Buscamos si el comercio ya tiene este producto (mapeo por nombre o slug base)
            const imported = merchantProducts.find(p => p.name === master.name);

            return {
                id: master.id, // ID del maestro
                merchantProductId: imported?.id || null, // ID del producto del comercio si existe
                name: master.name,
                slug: master.slug,
                description: master.description,
                price: imported?.price || master.price,
                stock: imported?.stock || 0,
                isActive: imported?.isActive || false,
                isImported: !!imported,
                image: master.images[0]?.url || null
            };
        });

        // Obtener info de la categoría
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                image: true
            }
        });

        return NextResponse.json({
            category,
            products: unifiedProducts
        });

    } catch (error) {
        console.error("Error fetching package products:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
