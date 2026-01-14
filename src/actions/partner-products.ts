
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "MERCHANT") {
        throw new Error("Unauthorized");
    }

    const user = session.user;

    // Get Merchant ID owned by user
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: user.id },
    });

    if (!merchant) {
        throw new Error("No merchant found for user");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const categoryId = formData.get("categoryId") as string;
    const isActive = formData.get("isActive") === "on";

    if (!name || isNaN(price)) {
        throw new Error("Missing required fields");
    }

    // Generate slug
    const slug = name.toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "") +
        "-" + Math.floor(Math.random() * 1000);

    const product = await prisma.product.create({
        data: {
            name,
            slug,
            description,
            price,
            costPrice: price * 0.7, // Default estimation
            isActive,
            merchantId: merchant.id,
            stock: 100, // Default stock
        }
    });

    // Link category
    if (categoryId) {
        await prisma.productCategory.create({
            data: {
                productId: product.id,
                categoryId: categoryId
            }
        });
    }

    revalidatePath("/partner/productos");
    redirect("/partner/productos");
}

export async function updateProduct(id: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "MERCHANT") {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const categoryId = formData.get("categoryId") as string;
    const isActive = formData.get("isActive") === "on";

    await prisma.product.update({
        where: { id },
        data: {
            name,
            description,
            price,
            isActive,
        }
    });

    // Update category (simplified: remove old, add new for now)
    // Real implementation should be smarter about relations
    if (categoryId) {
        // Delete all ensuring single category mostly for this simple app
        await prisma.productCategory.deleteMany({
            where: { productId: id }
        });

        await prisma.productCategory.create({
            data: {
                productId: id,
                categoryId: categoryId
            }
        });
    }

    revalidatePath("/partner/productos");
    redirect("/partner/productos");
}
