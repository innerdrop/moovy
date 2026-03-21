import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all listings for the authenticated seller
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!seller) {
            return NextResponse.json(
                { error: "No tenés perfil de vendedor. Activalo primero." },
                { status: 404 }
            );
        }

        const listings = await prisma.listing.findMany({
            where: { sellerId: seller.id },
            include: {
                images: { orderBy: { order: "asc" } },
                category: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(listings);
    } catch (error) {
        console.error("Error fetching seller listings:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Create a new listing
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!seller) {
            return NextResponse.json(
                { error: "No tenés perfil de vendedor. Activalo primero." },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { title, description, price, stock, condition, categoryId, weightKg, lengthCm, widthCm, heightCm, imageUrl } = body;

        // Validate required fields
        if (!title || price === undefined || price === null) {
            return NextResponse.json(
                { error: "Título y precio son obligatorios" },
                { status: 400 }
            );
        }

        if (typeof price !== "number" || price <= 0) {
            return NextResponse.json(
                { error: "El precio debe ser un número positivo" },
                { status: 400 }
            );
        }

        // Validate at least one image
        if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
            return NextResponse.json(
                { error: "Necesitás subir al menos 1 imagen para publicar tu listing" },
                { status: 400 }
            );
        }

        // Validate category if provided
        if (categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
            });
            if (!category) {
                return NextResponse.json(
                    { error: "Categoría no encontrada" },
                    { status: 400 }
                );
            }
        }

        const listing = await prisma.listing.create({
            data: {
                sellerId: seller.id,
                title,
                description: description || null,
                price,
                stock: stock ?? 1,
                condition: condition || "NUEVO",
                categoryId: categoryId || null,
                weightKg: typeof weightKg === "number" ? weightKg : null,
                lengthCm: typeof lengthCm === "number" ? lengthCm : null,
                widthCm: typeof widthCm === "number" ? widthCm : null,
                heightCm: typeof heightCm === "number" ? heightCm : null,
                images: {
                    create: {
                        url: imageUrl.trim(),
                        order: 0,
                    },
                },
            },
            include: {
                images: { orderBy: { order: "asc" } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });

        return NextResponse.json(listing, { status: 201 });
    } catch (error) {
        console.error("Error creating listing:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
