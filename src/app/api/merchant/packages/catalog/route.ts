import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const merchantId = (session?.user as any)?.merchantId;
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const scope = searchParams.get("scope") || "all"; // all | store | marketplace

        // Get categories with product counts
        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
                isPackageAvailable: true, // Solo las que están disponibles como paquete B2B
                parentId: null, // Only root categories (packages)
                ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
                ...(scope !== "all" ? { scope: { in: [scope.toUpperCase(), "BOTH"] } } : {}),
            },
            include: {
                children: {
                    include: {
                        _count: { select: { products: true } },
                    },
                },
                _count: { select: { products: true } },
            },
            orderBy: { order: "asc" },
        });

        // Get pricing tiers
        const pricingTiers = await prisma.packagePricingTier.findMany({
            where: { isActive: true },
            orderBy: { minItems: "asc" },
        });

        // Get merchant's existing purchases
        let ownedCategories: string[] = [];
        let ownedProducts: string[] = [];
        let purchaseHistory: any[] = [];

        if (merchantId) {
            const [ownedCats, ownedProds, purchases] = await Promise.all([
                prisma.merchantCategory.findMany({
                    where: { merchantId },
                    select: { categoryId: true },
                }),
                prisma.merchantAcquiredProduct.findMany({
                    where: { merchantId },
                    select: { productId: true },
                }),
                prisma.packagePurchase.findMany({
                    where: { merchantId },
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    include: { category: { select: { name: true, image: true } } },
                }),
            ]);

            ownedCategories = ownedCats.map(c => c.categoryId);
            ownedProducts = ownedProds.map(p => p.productId);
            purchaseHistory = purchases;
        }

        // Enrich categories with total product count (including children)
        const enrichedCategories = categories.map(cat => {
            let totalProducts = cat._count.products;
            if (cat.children) {
                for (const child of cat.children) {
                    totalProducts += child._count.products;
                }
            }
            return {
                ...cat,
                totalProducts,
                isOwned: ownedCategories.includes(cat.id),
            };
        });

        return NextResponse.json({
            categories: enrichedCategories,
            pricingTiers,
            ownedCategories,
            ownedProducts,
            purchaseHistory,
        });
    } catch (error) {
        console.error("Error fetching package catalog:", error);
        return NextResponse.json({ error: "Error al obtener catálogo de paquetes" }, { status: 500 });
    }
}