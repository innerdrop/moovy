import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditListingForm from "@/components/seller/EditListingForm";

export default async function EditListingPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/vendedor");
    }

    const { id } = await params;

    const seller = await prisma.sellerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
    });

    if (!seller) {
        redirect("/vendedor");
    }

    const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
            images: { orderBy: { order: "asc" } },
            category: { select: { id: true, name: true, slug: true } },
        },
    });

    if (!listing || listing.sellerId !== seller.id) {
        redirect("/vendedor/listings");
    }

    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    return (
        <EditListingForm
            listing={{
                id: listing.id,
                title: listing.title,
                description: listing.description,
                price: listing.price,
                stock: listing.stock,
                condition: listing.condition,
                categoryId: listing.categoryId,
                images: listing.images.map((img) => ({
                    url: img.url,
                    order: img.order,
                })),
            }}
            categories={categories}
        />
    );
}
