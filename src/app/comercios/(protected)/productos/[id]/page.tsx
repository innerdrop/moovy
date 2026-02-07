import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import EditProductForm from "@/components/comercios/EditProductForm";

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

    return (
        <div className="max-w-4xl mx-auto">
            <EditProductForm
                product={{
                    id: product.id,
                    name: product.name,
                    description: product.description || "",
                    price: product.price,
                    stock: product.stock,
                    imageUrls: product.images.map(img => img.url),
                    categoryId: product.categories[0]?.categoryId || "",
                    isActive: product.isActive,
                }}
                categories={categories}
            />
        </div>
    );
}
