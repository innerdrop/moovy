import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import EditProductForm from "@/components/comercios/EditProductForm";
import { getMerchantSizeOptions } from "@/lib/product-sizes";
import { getEffectiveCommissionWithSource, getDefaultMerchantCommission } from "@/lib/merchant-loyalty";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/comercios/login");
    }

    // Get merchant for this user
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: session.user.id },
    });

    if (!merchant) {
        redirect("/comercios");
    }

    // Get product with images and categories
    const product = await prisma.product.findFirst({
        where: {
            id: id,
            merchantId: merchant.id,
        },
        include: {
            images: true,
            categories: {
                include: { category: true }
            }
        }
    });

    if (!product) {
        notFound();
    }

    // Get all categories for the dropdown
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    // Opciones de tamaño (OPS) + comisión efectiva para el desglose del recargo
    // (0% en primer mes) + rate a futuro (lo que pagará cuando termine el mes gratis).
    const [sizeOptions, eff, defaultCommission] = await Promise.all([
        getMerchantSizeOptions(),
        getEffectiveCommissionWithSource(merchant.id),
        getDefaultMerchantCommission(),
    ]);
    const commissionRate = eff.rate;
    const firstMonthFree = eff.source === "FIRST_MONTH";
    const futureCommissionRate = firstMonthFree ? defaultCommission : commissionRate;

    return (
        <div className="max-w-4xl mx-auto">
            <EditProductForm
                sizeOptions={sizeOptions}
                commissionRate={commissionRate}
                firstMonthFree={firstMonthFree}
                futureCommissionRate={futureCommissionRate}
                product={{
                    id: product.id,
                    name: product.name,
                    description: product.description || "",
                    price: product.price,
                    stock: product.stock,
                    imageUrls: product.images.map(img => img.url),
                    categoryId: product.categories[0]?.categoryId || "",
                    isActive: product.isActive,
                    // Rama feat/peso-volumen-productos
                    weightGrams: product.weightGrams,
                    volumeMl: product.volumeMl,
                    packageCategoryId: product.packageCategoryId,
                    // feat/recargo-moovy-y-tamano-toggle: metadata del recargo
                    basePrice: product.basePrice,
                    markupPercent: product.markupPercent,
                }}
                categories={categories}
            />
        </div>
    );
}
