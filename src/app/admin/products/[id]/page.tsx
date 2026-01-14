import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";

export default async function EditProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [product, categories] = await Promise.all([
        prisma.product.findUnique({
            where: { id },
            include: { categories: true }
        }),
        prisma.category.findMany({ orderBy: { name: "asc" } })
    ]);

    if (!product) {
        notFound();
    }

    // Transform relation to array of IDs for the form
    const productData = {
        ...product,
        categoryIds: product.categories.map(c => c.categoryId),
        // Ensure description is string (handle null)
        description: product.description || "",
        image: product.image || null,
        // Ensure stock is number
        stock: product.stock || 0
    };

    return <ProductForm initialData={productData} categories={categories} />;
}
