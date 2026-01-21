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

// Helper to verify merchant ownership
async function verifyMerchantOwnership(productId: string, userId: string) {
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId },
    });

    if (!merchant) return null;

    const product = await prisma.product.findFirst({
        where: { id: productId, merchantId: merchant.id },
    });

    return product ? merchant : null;
}

export async function createProduct(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || !["MERCHANT", "ADMIN"].includes((session.user as any).role)) {
        return { error: "No autorizado" };
    }

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
        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
        });

        if (!merchant) {
            return { error: "No se encontró un comercio asociado a tu cuenta." };
        }

        const slug = `${data.name.toLowerCase().replace(/ /g, "-")}-${Date.now()}`;

        await prisma.product.create({
            data: {
                name: data.name,
                slug: slug,
                description: data.description,
                price: data.price,
                costPrice: data.price * 0.7,
                stock: data.stock,
                merchantId: merchant.id,
                images: {
                    create: {
                        url: data.imageUrl,
                        alt: data.name,
                        order: 0,
                    },
                },
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

export async function updateProduct(productId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || !["MERCHANT", "ADMIN"].includes((session.user as any).role)) {
        return { error: "No autorizado" };
    }

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
        const merchant = await verifyMerchantOwnership(productId, session.user.id);

        if (!merchant) {
            return { error: "No tienes permiso para editar este producto." };
        }

        // Update the product
        await prisma.product.update({
            where: { id: productId },
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                stock: data.stock,
            },
        });

        // Update image if changed
        const existingImage = await prisma.productImage.findFirst({
            where: { productId: productId },
        });

        if (existingImage) {
            await prisma.productImage.update({
                where: { id: existingImage.id },
                data: { url: data.imageUrl, alt: data.name },
            });
        } else {
            await prisma.productImage.create({
                data: {
                    productId: productId,
                    url: data.imageUrl,
                    alt: data.name,
                    order: 0,
                },
            });
        }

        // Update category if changed
        if (data.categoryId) {
            await prisma.productCategory.deleteMany({
                where: { productId: productId },
            });
            await prisma.productCategory.create({
                data: {
                    productId: productId,
                    categoryId: data.categoryId,
                },
            });
        }

        revalidatePath("/comercios/productos");
    } catch (error) {
        console.error("Error updating product:", error);
        return { error: "Error al actualizar el producto. Inténtalo de nuevo." };
    }

    redirect("/comercios/productos");
}

export async function deleteProduct(productId: string) {
    const session = await auth();
    if (!session?.user?.id || !["MERCHANT", "ADMIN"].includes((session.user as any).role)) {
        return { error: "No autorizado" };
    }

    try {
        const merchant = await verifyMerchantOwnership(productId, session.user.id);

        if (!merchant) {
            return { error: "No tienes permiso para eliminar este producto." };
        }

        // Soft delete - just deactivate
        await prisma.product.update({
            where: { id: productId },
            data: { isActive: false },
        });

        revalidatePath("/comercios/productos");
        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { error: "Error al eliminar el producto." };
    }
}

export async function toggleProductActive(productId: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user?.id || !["MERCHANT", "ADMIN"].includes((session.user as any).role)) {
        return { error: "No autorizado" };
    }

    try {
        const merchant = await verifyMerchantOwnership(productId, session.user.id);

        if (!merchant) {
            return { error: "No tienes permiso para modificar este producto." };
        }

        await prisma.product.update({
            where: { id: productId },
            data: { isActive },
        });

        revalidatePath("/comercios/productos");
        return { success: true };
    } catch (error) {
        console.error("Error toggling product:", error);
        return { error: "Error al modificar el producto." };
    }
}

