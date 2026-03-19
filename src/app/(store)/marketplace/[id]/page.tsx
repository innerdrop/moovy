// Marketplace Listing Detail Page - Server Component with SEO metadata + JSON-LD
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ListingDetailClient from "./ListingDetailClient";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.somosmoovy.com";

async function getListing(id: string) {
    try {
        return await prisma.listing.findUnique({
            where: { id },
            include: {
                seller: {
                    select: {
                        id: true,
                        displayName: true,
                        bio: true,
                        avatar: true,
                        rating: true,
                        totalSales: true,
                        isVerified: true,
                        createdAt: true,
                    },
                },
                images: { orderBy: { order: "asc" } },
                category: { select: { id: true, name: true, slug: true } },
            },
        });
    } catch {
        return null;
    }
}

async function getRelatedListings(sellerId: string, excludeId: string) {
    try {
        return await prisma.listing.findMany({
            where: {
                sellerId,
                isActive: true,
                id: { not: excludeId },
            },
            include: {
                images: { orderBy: { order: "asc" }, take: 1 },
                seller: {
                    select: {
                        id: true,
                        displayName: true,
                        rating: true,
                        avatar: true,
                    },
                },
                category: { select: { name: true } },
            },
            take: 4,
            orderBy: { createdAt: "desc" },
        });
    } catch {
        return [];
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const listing = await getListing(id);

    if (!listing || !listing.isActive) {
        return {
            title: "Publicación no encontrada — MOOVY",
            description: "La publicación que buscás no está disponible.",
        };
    }

    const title = `${listing.title} — MOOVY Marketplace`;
    const description = listing.description
        ? listing.description.slice(0, 160)
        : `Comprá ${listing.title} en el Marketplace MOOVY Ushuaia.`;
    const image = listing.images[0]?.url || `${APP_URL}/og-default.png`;
    const url = `${APP_URL}/marketplace/${listing.id}`;

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
            images: [{ url: image, width: 800, height: 800, alt: listing.title }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
        alternates: { canonical: url },
        other: {
            "product:price:amount": listing.price.toFixed(2),
            "product:price:currency": "ARS",
            "product:condition": listing.condition.toLowerCase(),
            "product:availability": listing.stock > 0 ? "in stock" : "out of stock",
            "product:retailer_item_id": listing.id,
        },
    };
}

export default async function MarketplaceDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const listing = await getListing(id);

    if (!listing || !listing.isActive) {
        notFound();
    }

    const sellerName = listing.seller.displayName || "Vendedor MOOVY";

    // JSON-LD structured data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: listing.title,
        description: listing.description || undefined,
        image: listing.images.map((img) => img.url),
        url: `${APP_URL}/marketplace/${listing.id}`,
        itemCondition:
            listing.condition === "NUEVO"
                ? "https://schema.org/NewCondition"
                : listing.condition === "REACONDICIONADO"
                  ? "https://schema.org/RefurbishedCondition"
                  : "https://schema.org/UsedCondition",
        offers: {
            "@type": "Offer",
            price: listing.price.toFixed(2),
            priceCurrency: "ARS",
            availability:
                listing.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
            seller: { "@type": "Person", name: sellerName },
            url: `${APP_URL}/marketplace/${listing.id}`,
            areaServed: { "@type": "City", name: "Ushuaia" },
        },
        ...(listing.category ? { category: listing.category.name } : {}),
    };

    // Fetch related listings from same seller
    const relatedListings = await getRelatedListings(listing.seller.id, listing.id);

    // Serialize for client (dates → strings)
    const serializedListing = {
        ...listing,
        seller: {
            ...listing.seller,
            createdAt: listing.seller.createdAt.toISOString(),
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ListingDetailClient
                listing={serializedListing}
                relatedListings={relatedListings}
                appUrl={APP_URL}
            />
        </>
    );
}
