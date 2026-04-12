import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { preferenceApi } from "@/lib/mercadopago";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["MERCHANT"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const merchantId = (session?.user as any)?.merchantId;
        if (!merchantId) {
            return NextResponse.json({ error: "Merchant no asociado" }, { status: 401 });
        }

        const body = await request.json();
        const { purchaseType, categoryId, productIds, promoCode } = body;

        if (!purchaseType || !["package", "starter", "custom", "individual"].includes(purchaseType)) {
            return NextResponse.json({ error: "Tipo de compra inválido" }, { status: 400 });
        }

        let amount = 0;
        let itemCount = 0;
        let categoryName = "Productos MOOVY";

        // Calculate price based on purchase type
        if (purchaseType === "package" || purchaseType === "starter") {
            if (!categoryId) {
                return NextResponse.json({ error: "categoryId requerido" }, { status: 400 });
            }

            const category = await prisma.category.findUnique({
                where: { id: categoryId },
                include: {
                    products: { where: { product: { merchantId: null, isActive: true } } },
                    children: {
                        include: { products: { where: { product: { merchantId: null, isActive: true } } } },
                    },
                },
            });

            if (!category) {
                return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
            }

            categoryName = category.name;

            // Count products (including from children)
            itemCount = category.products.length;
            if (category.children) {
                for (const child of category.children) {
                    itemCount += child.products.length;
                }
            }

            if (purchaseType === "starter" && category.starterPrice) {
                amount = category.starterPrice;
            } else {
                amount = category.price || 0;
            }

            // Check if merchant already owns this category
            const existingPurchase = await prisma.packagePurchase.findFirst({
                where: {
                    merchantId,
                    categoryId,
                    paymentStatus: "approved",
                    purchaseType: { in: ["package", "starter"] },
                },
            });

            if (existingPurchase) {
                return NextResponse.json({ error: "Ya adquiriste este paquete" }, { status: 409 });
            }

        } else if (purchaseType === "custom" || purchaseType === "individual") {
            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return NextResponse.json({ error: "productIds requerido" }, { status: 400 });
            }

            itemCount = productIds.length;

            // Calculate price from pricing tiers
            const tiers = await prisma.packagePricingTier.findMany({
                where: { isActive: true },
                orderBy: { minItems: "asc" },
            });

            if (tiers.length > 0) {
                // Find the best tier for this quantity
                const applicableTier = tiers
                    .filter(t => itemCount >= t.minItems && (!t.maxItems || itemCount <= t.maxItems))
                    .sort((a, b) => a.pricePerItem - b.pricePerItem)[0];

                if (applicableTier) {
                    amount = applicableTier.pricePerItem * itemCount;
                } else {
                    // Use individual price (most expensive tier or fallback)
                    const individualTier = tiers.find(t => t.minItems === 1) || tiers[0];
                    amount = (individualTier?.pricePerItem || 500) * itemCount;
                }
            } else {
                // Fallback pricing: $500 per individual item
                amount = 500 * itemCount;
            }

            categoryName = `${itemCount} productos seleccionados`;
        }

        // Handle free purchases (promos, founders, etc.)
        if (amount === 0 || promoCode === "FUNDADOR") {
            const purchase = await prisma.packagePurchase.create({
                data: {
                    merchantId,
                    purchaseType,
                    categoryId: categoryId || null,
                    productIds: productIds ? JSON.stringify(productIds) : null,
                    itemCount,
                    amount: 0,
                    paymentStatus: "approved",
                    paymentMethod: "free",
                    importStatus: "pending",
                    promoCode: promoCode || "free",
                },
            });

            // Auto-import for free purchases
            const importResult = await autoImportProducts(merchantId, purchase.id, purchaseType, categoryId, productIds);

            return NextResponse.json({
                success: true,
                purchaseId: purchase.id,
                paymentMethod: "free",
                imported: importResult.count,
            });
        }

        // Create MercadoPago preference
        const externalRef = `pkg_${crypto.randomUUID()}`;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://somosmoovy.com";
        const isLocalDev = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
        const notificationUrl = isLocalDev ? undefined : `${appUrl}/api/webhooks/mercadopago`;

        const preferenceBody = {
            items: [{
                id: `pkg-${purchaseType}-${categoryId || "custom"}`,
                title: `MOOVY Paquete: ${categoryName}`,
                quantity: 1,
                unit_price: amount,
                currency_id: "ARS" as const,
            }],
            back_urls: {
                success: `${appUrl}/comercios/paquetes/resultado?status=success&ref=${externalRef}`,
                failure: `${appUrl}/comercios/paquetes/resultado?status=failure&ref=${externalRef}`,
                pending: `${appUrl}/comercios/paquetes/resultado?status=pending&ref=${externalRef}`,
            },
            ...(notificationUrl ? { notification_url: notificationUrl } : {}),
            external_reference: externalRef,
            metadata: {
                purchase_type: "package_catalog",
                merchant_id: merchantId,
            },
            payer: {
                name: session?.user?.name || undefined,
                email: session?.user?.email || undefined,
            },
        };

        const preference = await preferenceApi.create({ body: preferenceBody });

        // Save purchase record
        const purchase = await prisma.packagePurchase.create({
            data: {
                merchantId,
                purchaseType,
                categoryId: categoryId || null,
                productIds: productIds ? JSON.stringify(productIds) : null,
                itemCount,
                amount,
                paymentStatus: "pending",
                paymentMethod: "mercadopago",
                mpPreferenceId: preference.id || null,
                mpExternalRef: externalRef,
                importStatus: "pending",
                promoCode,
            },
        });

        return NextResponse.json({
            success: true,
            purchaseId: purchase.id,
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
            amount,
            itemCount,
        });
    } catch (error) {
        console.error("Error creating package purchase:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// Auto-import products after confirmed payment
async function autoImportProducts(
    merchantId: string,
    purchaseId: string,
    purchaseType: string,
    categoryId?: string,
    productIds?: string[]
): Promise<{ count: number }> {
    try {
        let targetIds: string[] = [];

        if ((purchaseType === "package" || purchaseType === "starter") && categoryId) {
            // Get all master products in this category (and children)
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
                include: { children: { select: { id: true } } },
            });

            const categoryIds = [categoryId];
            if (category?.children) {
                categoryIds.push(...category.children.map(c => c.id));
            }

            const masterProducts = await prisma.product.findMany({
                where: {
                    merchantId: null,
                    isActive: true,
                    categories: { some: { categoryId: { in: categoryIds } } },
                },
                select: { id: true },
            });
            targetIds = masterProducts.map(p => p.id);

            // Register category acquisition
            await prisma.merchantCategory.upsert({
                where: { merchantId_categoryId: { merchantId, categoryId } },
                update: {},
                create: { merchantId, categoryId },
            });
        } else if (productIds && productIds.length > 0) {
            targetIds = productIds;

            // Register individual product acquisitions
            for (const productId of productIds) {
                await prisma.merchantAcquiredProduct.upsert({
                    where: { merchantId_productId: { merchantId, productId } },
                    update: {},
                    create: { merchantId, productId },
                });
            }
        }

        if (targetIds.length === 0) {
            await prisma.packagePurchase.update({
                where: { id: purchaseId },
                data: { importStatus: "imported", importedCount: 0, importedAt: new Date() },
            });
            return { count: 0 };
        }

        // Fetch master products with images and categories
        const masterProducts = await prisma.product.findMany({
            where: { id: { in: targetIds }, merchantId: null },
            include: { categories: true, images: true },
        });

        let count = 0;
        await prisma.$transaction(async (tx) => {
            for (const master of masterProducts) {
                const newSlug = `${master.slug}-${merchantId.substring(0, 5)}`;

                // Skip if already imported
                const existing = await tx.product.findFirst({
                    where: { OR: [{ slug: newSlug }, { name: master.name, merchantId }] },
                });
                if (existing) continue;

                await tx.product.create({
                    data: {
                        name: master.name,
                        slug: newSlug,
                        description: master.description,
                        price: master.price,
                        costPrice: master.costPrice,
                        stock: 100,
                        isActive: true,
                        merchantId,
                        images: {
                            create: master.images.map(img => ({
                                url: img.url,
                                alt: img.alt,
                                order: img.order,
                            })),
                        },
                        categories: {
                            create: master.categories.map(cat => ({
                                categoryId: cat.categoryId,
                            })),
                        },
                    },
                });
                count++;
            }
        });

        // Update purchase record
        await prisma.packagePurchase.update({
            where: { id: purchaseId },
            data: { importStatus: "imported", importedCount: count, importedAt: new Date() },
        });

        return { count };
    } catch (error) {
        console.error("Auto-import error:", error);
        await prisma.packagePurchase.update({
            where: { id: purchaseId },
            data: { importStatus: "failed" },
        }).catch(() => {});
        return { count: 0 };
    }
}

// Export for use from webhook
export { autoImportProducts };
