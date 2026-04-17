import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logUserActivity, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";

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
export async function POST(request: NextRequest) {
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
        const {
            title, description, price, stock, condition, categoryId,
            weightKg, lengthCm, widthCm, heightCm, imageUrl,
            // Campos de subasta (deshabilitados para lanzamiento — ISSUE-002)
            listingType, auctionDuration, startingPrice, bidIncrement,
        } = body;

        // ISSUE-002: Subastas deshabilitadas para lanzamiento. Solo precio fijo.
        // Reactivar en Fase 2 removiendo este bloque y descomentando la validación de abajo.
        if (listingType === "AUCTION") {
            return NextResponse.json(
                { error: "Las subastas no están disponibles en este momento. Publicá a precio fijo." },
                { status: 400 }
            );
        }

        const isAuction = false; // Forzado a false — subastas deshabilitadas

        // Validate required fields
        if (!title) {
            return NextResponse.json(
                { error: "El título es obligatorio" },
                { status: 400 }
            );
        }

        // ISSUE-002: Validación de subasta comentada para lanzamiento (reactivar en Fase 2)
        /*
        if (isAuction) {
            if (!startingPrice || typeof startingPrice !== "number" || startingPrice <= 0) {
                return NextResponse.json(
                    { error: "El precio base de la subasta debe ser un número positivo" },
                    { status: 400 }
                );
            }
            if (!bidIncrement || ![100, 500, 1000, 5000].includes(bidIncrement)) {
                return NextResponse.json(
                    { error: "El incremento mínimo debe ser $100, $500, $1.000 o $5.000" },
                    { status: 400 }
                );
            }
            if (!auctionDuration || ![6, 12, 24, 48, 72].includes(auctionDuration)) {
                return NextResponse.json(
                    { error: "La duración debe ser 6, 12, 24, 48 o 72 horas" },
                    { status: 400 }
                );
            }
        } else {
        */
        {
            // Venta directa: precio obligatorio
            if (price === undefined || price === null || typeof price !== "number" || price <= 0) {
                return NextResponse.json(
                    { error: "El precio debe ser un número positivo" },
                    { status: 400 }
                );
            }
        }

        // Validate at least one image
        if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
            return NextResponse.json(
                { error: "Necesitás subir al menos 1 imagen para publicar" },
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

        // Calcular fecha de fin si es subasta
        const auctionEndsAt = isAuction
            ? new Date(Date.now() + auctionDuration * 60 * 60 * 1000)
            : null;

        const listing = await prisma.listing.create({
            data: {
                sellerId: seller.id,
                title,
                description: description || null,
                price: isAuction ? (startingPrice as number) : price,
                stock: isAuction ? 1 : (stock ?? 1),
                condition: condition || "NUEVO",
                categoryId: categoryId || null,
                weightKg: typeof weightKg === "number" ? weightKg : null,
                lengthCm: typeof lengthCm === "number" ? lengthCm : null,
                widthCm: typeof widthCm === "number" ? widthCm : null,
                heightCm: typeof heightCm === "number" ? heightCm : null,
                // Campos de subasta
                listingType: isAuction ? "AUCTION" : "DIRECT",
                startingPrice: isAuction ? startingPrice : null,
                bidIncrement: isAuction ? bidIncrement : null,
                auctionDuration: isAuction ? auctionDuration : null,
                auctionEndsAt,
                auctionStatus: isAuction ? "ACTIVE" : null,
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

        // Log listing creation activity (fire-and-forget)
        const { ipAddress, userAgent } = extractRequestInfo(request);
        logUserActivity({
            userId: userId,
            action: ACTIVITY_ACTIONS.LISTING_ADDED,
            entityType: "Listing",
            entityId: listing.id,
            metadata: { title: listing.title, price: listing.price, listingType: listing.listingType },
            ipAddress,
            userAgent,
        }).catch((err) => console.error("[Listing] Failed to log listing creation activity:", err));

        return NextResponse.json(listing, { status: 201 });
    } catch (error) {
        console.error("Error creating listing:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
