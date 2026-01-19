"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const productSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
    stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
    imageUrl: z.string().min(1, "Debes subir al menos una imagen"),
    categoryId: z.string().optional(),
});

export async function createProduct(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "MERCHANT") {
        return { error: "No autorizado" };
    }

    // validate data
    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        price: formData.get("price"),
        stock: formData.get("stock"),
        imageUrl: formData.get("imageUrl"),
        categoryId: formData.get("categoryId"),
    };

    const validation = productSchema.safeParse(rawData);

    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    const data = validation.data;

    try {
        // Find the merchant owned by this user
        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
        });

        if (!merchant) {
            return { error: "No se encontró un comercio asociado a tu cuenta." };
        }

        // Create slug
        const slug = `${data.name.toLowerCase().replace(/ /g, "-")}-${Date.now()}`;

        // Create Product
        await prisma.product.create({
            data: {
                name: data.name,
                slug: slug,
                description: data.description,
                price: data.price,
                costPrice: data.price * 0.7, // Estimate default margin
                stock: data.stock,
                merchantId: merchant.id,
                images: {
                    create: {
                        url: data.imageUrl,
                        alt: data.name,
                        order: 0,
                    },
                },
                // Link category if provided
                categories: data.categoryId ? {
                    create: {
                        categoryId: data.categoryId,
                    }
                } : undefined
            },
        });

        revalidatePath("/comercios/productos");
    } catch (error) {
        console.error("Error creating product:", error);
        return { error: "Error al crear el producto. Inténtalo de nuevo." };
    }

    redirect("/comercios/productos");
}
