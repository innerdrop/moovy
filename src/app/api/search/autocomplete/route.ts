// API: Lightweight autocomplete — products + listings combined
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { buscarProductos, buscarComercios } from "@/lib/search";

export async function GET(request: Request) {
    const limited = await applyRateLimit(request, "autocomplete", 60, 60_000);
    if (limited) return limited;

    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim();

        if (!q || q.length < 1) {
            return NextResponse.json({ suggestions: [] });
        }

        // feat/busqueda-inteligente (2026-07-28): productos y comercios salen del
        // motor único (src/lib/search.ts) — acentos, palabras sueltas y rubro.
        // Antes esta ruta tenía su propia consulta y daba resultados DISTINTOS a
        // los de la página de resultados para la misma búsqueda.
        // Las publicaciones del marketplace siguen acá: son otro dominio y el
        // founder pidió que tengan su propio buscador (anotado en ISSUES).
        const [productosMotor, comerciosMotor, listings] = await Promise.all([
            buscarProductos(q, 4),
            buscarComercios(q, 3),
            prisma.listing.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { title: { contains: q, mode: "insensitive" } },
                        { description: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
                    seller: { select: { displayName: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 4,
            }),
        ]);

        const merchants = comerciosMotor;
        const products = productosMotor;

        const suggestions = [
            ...merchants.map((m) => ({
                type: "comercio" as const,
                id: m.id,
                label: m.name,
                image: m.image,
                href: `/tienda/${m.slug}`,
                extra: m.isOpen ? "Abierto" : "Cerrado",
            })),
            ...products.map((p) => ({
                type: "tienda" as const,
                id: p.id,
                label: p.name,
                image: p.imagen,
                href: `/productos/${encodeURIComponent(p.slug)}`,
                // El desplegable ahora dice DE QUIÉN es cada producto y si ese
                // comercio está abierto: un producto suelto no le sirve a nadie.
                extra: p.merchantName,
                merchantIsOpen: p.merchantIsOpen,
                price: Number(p.price),
            })),
            ...listings.map((l) => ({
                type: "marketplace" as const,
                id: l.id,
                label: l.title,
                image: l.images[0]?.url || null,
                href: `/marketplace/${l.id}`,
                extra: l.seller?.displayName || null,
                price: Number(l.price),
            })),
        ];

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error("Autocomplete error:", error);
        return NextResponse.json({ suggestions: [] });
    }
}
