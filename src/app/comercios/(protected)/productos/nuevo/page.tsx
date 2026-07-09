import { prisma } from "@/lib/prisma";
import NewProductForm from "@/components/comercios/NewProductForm";
import { auth } from "@/lib/auth";
import { getMerchantSizeOptions } from "@/lib/product-sizes";
import { isFeatureEnabled, FEATURE_FLAGS } from "@/lib/feature-flags";
import { getEffectiveCommissionWithSource, getDefaultMerchantCommission } from "@/lib/merchant-loyalty";

export default async function NewProductPage() {
    const session = await auth();
    const merchantId = (session?.user as any)?.merchantId;

    // 1. Get categories and individual products the merchant has purchased/acquired
    const [merchantCategoryIds, merchantProductIds] = await Promise.all([
        prisma.merchantCategory.findMany({
            where: { merchantId: merchantId },
            select: { categoryId: true }
        }).then((results: { categoryId: string }[]) => results.map(r => r.categoryId)),
        prisma.merchantAcquiredProduct.findMany({
            where: { merchantId: merchantId },
            select: { productId: true }
        }).then((results: { productId: string }[]) => results.map(r => r.productId))
    ]);

    // 2. Fetch all products: either from an acquired category OR acquired individually
    const masterProducts = merchantCategoryIds.length > 0 || merchantProductIds.length > 0
        ? await prisma.product.findMany({
            where: {
                merchantId: null,
                isActive: true,
                OR: [
                    ...(merchantCategoryIds.length > 0 ? [{
                        categories: {
                            some: {
                                categoryId: { in: merchantCategoryIds }
                            }
                        }
                    }] : []),
                    ...(merchantProductIds.length > 0 ? [{
                        id: { in: merchantProductIds }
                    }] : [])
                ]
            },
            include: {
                images: { take: 1 },
                categories: {
                    include: { category: true }
                }
            },
            orderBy: { name: "asc" }
        })
        : [];

    // 3. Get unique categories from purchased catalog products (for catalog dropdown)
    const availableCategoryIds = Array.from(new Set(
        masterProducts.flatMap(p => p.categories.map(c => c.categoryId))
    ));

    const categories = availableCategoryIds.length > 0
        ? await prisma.category.findMany({
            where: {
                id: { in: availableCategoryIds },
                isActive: true
            },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        })
        : [];

    // 4. Fetch ALL active categories for the manual product form (independent of purchased packages)
    const allCategories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    // 5. Opciones de tamaño derivadas de OPS (PackageCategory) + flag de paquetes.
    //    + comisión efectiva para el desglose del recargo (0% en primer mes) y el
    //    rate a futuro (lo que pagará cuando termine el mes gratis).
    const [sizeOptions, paquetesEnabled, eff, defaultCommission] = await Promise.all([
        getMerchantSizeOptions(),
        isFeatureEnabled(FEATURE_FLAGS.MERCHANT_PAQUETES),
        merchantId ? getEffectiveCommissionWithSource(merchantId) : Promise.resolve(null),
        getDefaultMerchantCommission(),
    ]);
    const commissionRate = eff ? eff.rate : defaultCommission;
    const firstMonthFree = eff?.source === "FIRST_MONTH";
    const futureCommissionRate = firstMonthFree ? defaultCommission : commissionRate;

    return (
        <div className="max-w-4xl mx-auto">
            <NewProductForm
                categories={categories}
                allCategories={allCategories}
                sizeOptions={sizeOptions}
                paquetesEnabled={paquetesEnabled}
                commissionRate={commissionRate}
                firstMonthFree={firstMonthFree}
                futureCommissionRate={futureCommissionRate}
                catalogProducts={masterProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description || "",
                    price: p.price,
                    imageUrl: p.images[0]?.url || "",
                    categoryId: p.categories[0]?.categoryId || ""
                }))}
            />
        </div>
    );
}

