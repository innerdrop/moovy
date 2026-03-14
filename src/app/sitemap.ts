import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.somosmoovy.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        "",
        "/tienda",
        "/marketplace",
        "/buscar",
        "/ayuda",
        "/moover",
        "/contacto",
        "/nosotros",
        "/terminos",
        "/privacidad",
        "/cookies",
        "/devoluciones",
        "/cancelaciones",
        "/terminos-vendedor",
        "/terminos-repartidor",
        "/terminos-comercio",
    ].map((path) => ({
        url: `${BASE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
    }));

    // Active merchants
    const merchants = await prisma.merchant.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
    });
    const merchantPages: MetadataRoute.Sitemap = merchants.map((m) => ({
        url: `${BASE_URL}/tienda/${m.slug}`,
        lastModified: m.updatedAt,
        changeFrequency: "daily",
        priority: 0.7,
    }));

    // Active products
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
    });
    const productPages: MetadataRoute.Sitemap = products.map((p) => ({
        url: `${BASE_URL}/productos/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "daily",
        priority: 0.6,
    }));

    // Active listings (marketplace)
    const listings = await prisma.listing.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
    });
    const listingPages: MetadataRoute.Sitemap = listings.map((l) => ({
        url: `${BASE_URL}/marketplace/${l.id}`,
        lastModified: l.updatedAt,
        changeFrequency: "daily",
        priority: 0.6,
    }));

    return [...staticPages, ...merchantPages, ...productPages, ...listingPages];
}
