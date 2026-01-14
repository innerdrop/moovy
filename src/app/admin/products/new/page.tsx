import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true }
    });

    return <ProductForm categories={categories} />;
}
