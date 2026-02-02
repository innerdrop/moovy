import { prisma } from "@/lib/prisma";
import NewProductForm from "@/components/comercios/NewProductForm";
import { auth } from "@/lib/auth";

export default async function NewProductPage() {
    const session = await auth();
    const merchantId = (session?.user as any)?.merchantId;

    // 1. Get categories the merchant has purchased/acquired
    const merchantCategoryIds = await prisma.merchantCategory.findMany({
        where: { merchantId: merchantId },
        select: { categoryId: true }
    }).then(results => results.map(r => r.categoryId));


    // 2. Fetch only those categories for the dropdown
    const categories = await prisma.category.findMany({
        where: {
            id: { in: merchantCategoryIds },
            isActive: true
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    // 3. Fetch only master products from those acquired categories
    const masterProducts = await prisma.product.findMany({
        where: {
            merchantId: null, // Master products
            isActive: true,
            categories: {
                some: {
                    categoryId: { in: merchantCategoryIds }
                }
            }
        },
        include: {
            images: { take: 1 },
            categories: {
                include: { category: true }
            }
        },
        orderBy: { name: "asc" }
    });

    return (
        <div className="max-w-4xl mx-auto">
            <NewProductForm
                categories={categories}
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

