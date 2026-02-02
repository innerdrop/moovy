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

        // Obtener productos del comercio que pertenecen a esta categoría
        const products = await prisma.product.findMany({
            where: {
                merchantId: merchant.id,
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
                },
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
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
            products: products.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                price: p.price,
                stock: p.stock,
                isActive: p.isActive,
                image: p.images[0]?.url || null
            }))
        });

    } catch (error) {
        console.error("Error fetching package products:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
