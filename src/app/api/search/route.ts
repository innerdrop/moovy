// API: Unified Search — products (from merchants) + listings (from sellers)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { buscarTodo } from "@/lib/search";

export async function GET(request: Request) {
    // Rate limit: max 30 searches per minute per IP
    const limited = await applyRateLimit(request, "search", 30, 60_000);
    if (limited) return limited;

    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim();
        const tab = searchParams.get("tab") || "comercios"; // "comercios" | "marketplace"
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
        const offset = parseInt(searchParams.get("offset") || "0");

        if (!q || q.length < 2) {
            return NextResponse.json({ results: [], total: 0 });
        }

        if (tab === "marketplace") {
            // Search marketplace listings
            const where: any = {
                isActive: true,
                OR: [
                    { title: { contains: q, mode: "insensitive" } },
                    { description: { contains: q, mode: "insensitive" } },
                ],
            };

            const [listings, total] = await Promise.all([
                prisma.listing.findMany({
                    where,
                    include: {
                        seller: {
                            select: {
                                id: true,
                                displayName: true,
                                rating: true,
                                avatar: true,
                            },
                        },
                        images: { orderBy: { order: "asc" }, take: 1 },
                        category: { select: { id: true, name: true, slug: true } },
                    },
                    orderBy: { createdAt: "desc" },
                    take: limit,
                    skip: offset,
                }),
                prisma.listing.count({ where }),
            ]);

            return NextResponse.json({ results: listings, total });
        }

        // feat/busqueda-inteligente (2026-07-28): la búsqueda de la tienda pasa
        // por el motor único (src/lib/search.ts). Antes esta ruta tenía su propia
        // consulta: acentos, palabras sueltas y rubro se arreglaban acá y NO en
        // el desplegable del header, así que la misma búsqueda daba resultados
        // distintos según dónde la escribieras.
        const { productos, comercios, hayAproximados } = await buscarTodo(q, {
            limiteProductos: limit,
            limiteComercios: 10,
        });

        // La página de resultados espera el shape de Prisma (images[], merchant{}).
        // Se traduce acá para no tocar el cliente en esta rama.
        const products = productos.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            stock: p.stock,
            images: p.imagen ? [{ url: p.imagen }] : [],
            merchant: p.merchantId
                ? {
                      id: p.merchantId,
                      name: p.merchantName,
                      slug: p.merchantSlug,
                      isOpen: p.merchantIsOpen ?? false,
                      image: p.merchantImage,
                      rating: null,
                  }
                : null,
            aproximado: p.aproximado ?? false,
        }));

        const merchants = comercios.map((m) => ({
            ...m,
            description: null,
            isVerified: false,
            isPremium: false,
            premiumTier: null,
            deliveryFee: 0,
            aproximado: m.aproximado ?? false,
        }));

        const productTotal = products.length;
        const merchantTotal = merchants.length;

        return NextResponse.json({
            results: products,
            total: productTotal,
            merchants,
            merchantTotal,
            // true = parte de lo que se devuelve son coincidencias APROXIMADAS
            // (la búsqueda exacta trajo poco). El cliente lo avisa; nunca se
            // mezclan con las exactas sin decirlo.
            hayAproximados,
        });
    } catch (error) {
        console.error("Error in unified search:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
