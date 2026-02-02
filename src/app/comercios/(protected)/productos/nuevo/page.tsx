import { prisma } from "@/lib/prisma";
import NewProductForm from "@/components/comercios/NewProductForm";
import { auth } from "@/lib/auth";

export default async function NewProductPage() {
    const session = await auth();
    const merchantId = (session?.user as any)?.merchantId;

    // Fetch categories for the dropdown
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    // Fetch all master products that belong to categories this merchant has access to
    // In this simplified version, let's just fetch all master products
    // Alternatively, we could filter by specific "PackagePurchase" if that model existed
    // For now, based on user's "paquetes que compró", we'll fetch master products.
    // If the merchant ALREADY HAS a product cloned from that master, we can still show it or filter it.

    const masterProducts = await prisma.product.findMany({
        where: {
            merchantId: null, // Master products
            isActive: true,
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
