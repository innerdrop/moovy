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
    imageUrls: z.string().transform((val) => {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }).refine((arr) => arr.length > 0, "Debes subir al menos una imagen"),
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

export async function importCatalogProducts(productIds: string[]) {
    const session = await auth();
    const merchantId = (session?.user as any)?.merchantId;

    if (!session || !merchantId) {
        return { error: "No autorizado" };
    }

    try {
        // 1. Get merchant's acquisition rights
        const [acquiredCategories, acquiredIndividual] = await Promise.all([
            prisma.merchantCategory.findMany({
                where: { merchantId },
                select: { categoryId: true }
            }).then((res: { categoryId: string }[]) => res.map(r => r.categoryId)),
            prisma.merchantAcquiredProduct.findMany({
                where: { merchantId },
                select: { productId: true }
            }).then((res: { productId: string }[]) => res.map(r => r.productId))
        ]);

        // 2. Fetch master products that match requested IDs AND are either in an acquired category OR individually acquired
        const masterProducts = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                merchantId: null,
                OR: [
                    {
                        categories: {
                            some: {
                                categoryId: { in: acquiredCategories }
                            }
                        }
                    },
                    {
                        id: { in: acquiredIndividual }
                    }
                ]
            },
            include: {
                categories: true,
                images: true
            }
        });

        if (masterProducts.length === 0) {
            return { error: "No se encontraron productos válidos o no tienes permisos." };
        }

        let count = 0;
        let skipped = 0;
        await prisma.$transaction(async (tx) => {
            for (const master of masterProducts) {
                const newSlug = `${master.slug}-${merchantId.substring(0, 5)}`;

                const existing = await tx.product.findFirst({
                    where: {
                        OR: [
                            { slug: newSlug },
                            { name: master.name, merchantId: merchantId }
                        ]
                    }
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                await tx.product.create({
                    data: {
                        name: master.name,
                        slug: newSlug,
                        description: master.description,
                        price: master.price,
                        costPrice: master.costPrice,
                        stock: 100,
                        isActive: true,
                        merchantId: merchantId,
                        images: {
                            create: master.images.map(img => ({
                                url: img.url,
                                alt: img.alt,
                                order: img.order
                            }))
                        },
                        categories: {
                            create: master.categories.map(cat => ({
                                categoryId: cat.categoryId
                            }))
                        }
                    }
                });
                count++;
            }
        });

        revalidatePath("/comercios/productos");
        revalidatePath("/comercios/productos/nuevo");

        if (count === 0 && skipped > 0) {
            return { error: "Este producto ya existe en tu inventario." };
        }

        return { success: true, count };
    } catch (error) {
        console.error("Error importing products:", error);
        return { error: "Error al importar productos" };
    }
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
                images: data.imageUrls && data.imageUrls.length > 0 ? {
                    create: data.imageUrls.map((url: string, index: number) => ({
                        url,
                        alt: data.name,
                        order: index,
                    })),
                } : undefined,
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
        imageUrls: formData.get("imageUrls"),
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

        // Sync images: delete all existing and create new ones
        await prisma.productImage.deleteMany({
            where: { productId: productId },
        });

        if (data.imageUrls.length > 0) {
            await prisma.productImage.createMany({
                data: data.imageUrls.map((url: string, index: number) => ({
                    productId: productId,
                    url: url,
                    alt: data.name,
                    order: index,
                })),
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
        revalidatePath("/tienda");
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

        // Try to hard delete first
        try {
            await prisma.product.delete({
                where: { id: productId },
            });
            revalidatePath("/comercios/productos");
            return { success: true, message: "Producto eliminado definitivamente." };
        } catch (error) {
            // If it has dependencies (like OrderItems), soft delete it
            await prisma.product.update({
                where: { id: productId },
                data: { isActive: false },
            });
            revalidatePath("/comercios/productos");
            return { success: true, message: "Producto desactivado (tiene historial de ventas)." };
        }
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

// ============================================
// MERCHANT SETTINGS ACTIONS
// ============================================

const merchantSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional(),
    image: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    category: z.string().optional(),
    deliveryTimeMin: z.coerce.number().int().min(5).optional(),
    deliveryTimeMax: z.coerce.number().int().min(10).optional(),
    deliveryFee: z.coerce.number().min(0).optional(),
    minOrderAmount: z.coerce.number().min(0).optional(),
    latitude: z.coerce.number().optional().nullable(),
    longitude: z.coerce.number().optional().nullable(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    ownerPhone: z.string().optional(),
});

export async function updateMerchant(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || !["MERCHANT", "ADMIN"].includes((session.user as any).role)) {
        return { error: "No autorizado" };
    }

    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        image: formData.get("image"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        category: formData.get("category"),
        deliveryTimeMin: formData.get("deliveryTimeMin"),
        deliveryTimeMax: formData.get("deliveryTimeMax"),
        deliveryFee: formData.get("deliveryFee"),
        minOrderAmount: formData.get("minOrderAmount"),
        latitude: formData.get("latitude"),
        longitude: formData.get("longitude"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        ownerPhone: formData.get("ownerPhone"),
    };

    const validation = merchantSchema.safeParse(rawData);

    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    const data = validation.data;

    // Auto-geocode if address is provided but no coordinates
    let finalLatitude = data.latitude ?? null;
    let finalLongitude = data.longitude ?? null;

    if (data.address && (!finalLatitude || !finalLongitude)) {
        try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const fullAddress = `${data.address}, Ushuaia, Tierra del Fuego, Argentina`;
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

            const geoResponse = await fetch(geocodeUrl);
            const geoData = await geoResponse.json();

            if (geoData.status === "OK" && geoData.results.length > 0) {
                finalLatitude = geoData.results[0].geometry.location.lat;
                finalLongitude = geoData.results[0].geometry.location.lng;
                console.log(`[Merchant] Auto-geocoded "${data.address}" to ${finalLatitude}, ${finalLongitude}`);
            }
        } catch (geoError) {
            console.error("[Merchant] Geocoding error:", geoError);
        }
    }

    try {
        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
        });

        if (!merchant) {
            return { error: "No se encontró un comercio asociado a tu cuenta." };
        }

        // Update Merchant and Owner
        await prisma.$transaction([
            prisma.merchant.update({
                where: { id: merchant.id },
                data: {
                    name: data.name,
                    businessName: data.name, // Support both fields
                    description: data.description || null,
                    image: data.image || null,
                    email: data.email || null,
                    phone: data.phone || null,
                    address: data.address || null,
                    category: data.category || "Otro",
                    deliveryTimeMin: data.deliveryTimeMin || 30,
                    deliveryTimeMax: data.deliveryTimeMax || 45,
                    deliveryFee: data.deliveryFee || 0,
                    minOrderAmount: data.minOrderAmount || 0,
                    latitude: finalLatitude,
                    longitude: finalLongitude,
                },
            }),
            prisma.user.update({
                where: { id: session.user.id },
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    name: `${data.firstName?.trim()} ${data.lastName?.trim()}`,
                    phone: data.ownerPhone,
                }
            })
        ]);

        revalidatePath("/comercios/configuracion");
        revalidatePath("/comercios");
        return { success: true };
    } catch (error) {
        console.error("Error updating merchant:", error);
        return { error: "Error al actualizar el comercio." };
    }
}

export async function toggleMerchantOpen(isOpen: boolean) {
    const session = await auth();
    if (!session?.user?.id || !["MERCHANT", "ADMIN"].includes((session.user as any).role)) {
        return { error: "No autorizado" };
    }

    try {
        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
        });

        if (!merchant) {
            return { error: "No se encontró un comercio asociado a tu cuenta." };
        }

        await prisma.merchant.update({
            where: { id: merchant.id },
            data: { isOpen },
        });

        revalidatePath("/comercios/configuracion");
        revalidatePath("/comercios");
        revalidatePath("/tienda");
        revalidatePath("/");
        if (merchant.slug) {
            revalidatePath(`/store/${merchant.slug}`);
        }
        return { success: true, isOpen };
    } catch (error) {
        console.error("Error toggling merchant:", error);
        return { error: "Error al modificar el estado del comercio." };
    }
}


