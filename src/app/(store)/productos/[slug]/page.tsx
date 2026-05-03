// Product Detail Page - Server Component with SEO metadata + JSON-LD
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/slugify";
import ProductDetailClient from "./ProductDetailClient";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.somosmoovy.com";

const includeOpts = {
    categories: { include: { category: true } } as const,
    images: { orderBy: { order: "asc" as const }, take: 4 },
    merchant: {
        select: {
            name: true,
            slug: true,
            isOpen: true,
            // Rama feat/bloqueo-comercio-cerrado: necesitamos scheduleJson para
            // calcular el estado real (pausa + horario) en el detail client.
            scheduleJson: true,
            deliveryRadiusKm: true,
            minOrderAmount: true,
            allowPickup: true,
        },
    },
};

async function getProduct(rawSlug: string) {
    const decoded = decodeURIComponent(rawSlug);

    try {
        // 1. Exact match
        let product = await prisma.product.findFirst({
            where: { slug: decoded, isActive: true },
            include: includeOpts,
        });

        // 2. Normalized (accent-stripped)
        if (!product) {
            const normalized = normalizeSlug(decoded);
            product = await prisma.product.findFirst({
                where: { slug: normalized, isActive: true },
                include: includeOpts,
            });
        }

        // 3. startsWith fallback for truncated slugs (e.g. accented chars split by ?)
        if (!product) {
            product = await prisma.product.findFirst({
                where: { slug: { startsWith: decoded }, isActive: true },
                include: includeOpts,
            });
        }

        return product;
    } catch {
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        return {
            title: "Producto no encontrado — MOOVY",
            description: "El producto que buscás no está disponible.",
        };
    }

    const title = `${product.name} — MOOVY Ushuaia`;
    const description = product.description
        ? product.description.slice(0, 160)
        : `Comprá ${product.name} en MOOVY. Delivery en Ushuaia.`;
    const image = product.images[0]?.url || `${APP_URL}/og-default.png`;
    const url = `${APP_URL}/productos/${product.slug}`;
    const price = product.price.toFixed(2);
    const category = product.categories[0]?.category?.name;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: "MOOVY",
            locale: "es_AR",
            type: "website",
            images: [
                {
                    url: image,
                    width: 800,
                    height: 800,
                    alt: product.name,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
        alternates: {
            canonical: url,
        },
        other: {
            "product:price:amount": price,
            "product:price:currency": "ARS",
            ...(category ? { "product:category": category } : {}),
            "product:availability": product.stock > 0 ? "in stock" : "out of stock",
        },
    };
}

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const product = await getProduct(slug);

    // JSON-LD structured data for Google
    const jsonLd = product
        ? {
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: product.description || undefined,
              image: product.images.map((img) => img.url),
              url: `${APP_URL}/productos/${product.slug}`,
              brand: {
                  "@type": "Organization",
                  name: product.merchant?.name || "MOOVY",
              },
              offers: {
                  "@type": "Offer",
                  price: product.price.toFixed(2),
                  priceCurrency: "ARS",
                  availability:
                      product.stock > 0
                          ? "https://schema.org/InStock"
                          : "https://schema.org/OutOfStock",
                  seller: {
                      "@type": "Organization",
                      name: product.merchant?.name || "MOOVY",
                  },
                  url: `${APP_URL}/productos/${product.slug}`,
                  areaServed: {
                      "@type": "City",
                      name: "Ushuaia",
                  },
              },
              ...(product.categories[0]?.category?.name
                  ? { category: product.categories[0].category.name }
                  : {}),
          }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ProductDetailClient />
        </>
    );
}
