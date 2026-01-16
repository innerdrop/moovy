import { prisma } from "@/lib/prisma";
import NewProductForm from "@/components/comercios/NewProductForm";

export default async function NewProductPage() {
    // Fetch categories for the dropdown
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    return (
        <div className="max-w-4xl mx-auto">
            <NewProductForm categories={categories} />
        </div>
    );
}
