import { prisma } from "@/lib/prisma";
import NewListingForm from "@/components/seller/NewListingForm";

export default async function NuevaListingPage() {
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    return <NewListingForm categories={categories} />;
}
