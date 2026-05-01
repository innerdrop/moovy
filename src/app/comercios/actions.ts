"use server";

import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
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
    // Rama feat/peso-volumen-productos: campos opcionales con fallback en
    // resolveItemWeight(). Permitimos 0 como "no cargado" → null en DB.
    // El form principal manda los gramos derivados del SizeSelector (Glovo-style);
    // el modo avanzado permite tipearlos exactos. productSize es informativo
    // para audit/analítica futura (ver qué tan bien acierta la sugerencia).
    weightGrams: z.coerce.number().int().min(0).max(500000).optional()
        .transform((v) => (v && v > 0 ? v : null)),
    volumeMl: z.coerce.number().int().min(0).max(1000000).optional()
        .transform((v) => (v && v > 0 ? v : null)),
    packageCategoryId: z.string().optional().transform((v) => (v && v.length > 0 ? v : null)),
    productSize: z.enum(["MICRO", "SMALL", "MEDIUM", "LARGE", "XL", ""]).optional(),
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
    if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
        return { error: "No autorizado" };
    }

    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        price: formData.get("price"),
        stock: formData.get("stock"),
        imageUrls: formData.get("imageUrls"),
        categoryId: formData.get("categoryId"),
        weightGrams: formData.get("weightGrams"),
        volumeMl: formData.get("volumeMl"),
        packageCategoryId: formData.get("packageCategoryId"),
        productSize: formData.get("productSize") || undefined,
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
                // Rama feat/peso-volumen-productos
                weightGrams: data.weightGrams,
                volumeMl: data.volumeMl,
                packageCategoryId: data.packageCategoryId,
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
    if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
        return { error: "No autorizado" };
    }

    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        price: formData.get("price"),
        stock: formData.get("stock"),
        imageUrls: formData.get("imageUrls"),
        categoryId: formData.get("categoryId"),
        weightGrams: formData.get("weightGrams"),
        volumeMl: formData.get("volumeMl"),
        packageCategoryId: formData.get("packageCategoryId"),
        productSize: formData.get("productSize") || undefined,
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
                // Rama feat/peso-volumen-productos
                weightGrams: data.weightGrams,
                volumeMl: data.volumeMl,
                packageCategoryId: data.packageCategoryId,
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
    if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
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
    if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
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
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    category: z.string().optional(),
    deliveryTimeMin: z.coerce.number().int().min(0).optional().transform(v => (v && v > 0 && v < 5) ? 5 : v),
    deliveryTimeMax: z.coerce.number().int().min(0).optional().transform(v => (v && v > 0 && v < 10) ? 10 : v),
    deliveryFee: z.coerce.number().min(0).optional(),
    minOrderAmount: z.coerce.number().min(0).optional(),
    deliveryRadiusKm: z.coerce.number().min(0).max(50).optional(),
    allowPickup: z.string().optional().transform(v => v === "true"),
    latitude: z.coerce.number().optional().nullable(),
    longitude: z.coerce.number().optional().nullable(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    ownerPhone: z.string().optional(),
    instagramUrl: z.string().optional(),
    facebookUrl: z.string().optional(),
    whatsappNumber: z.string().optional(),
});

export async function updateMerchant(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
        return { error: "No autorizado" };
    }

    // Build rawData filtering out null values (fields not present in the form)
    // Zod .optional() accepts undefined but NOT null, and formData.get() returns null for missing fields
    const allFields = {
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
        deliveryRadiusKm: formData.get("deliveryRadiusKm"),
        // allowPickup uses hidden input "false" + checkbox "true" pattern.
        // FormData.get() returns the first value (always "false"). Use getAll() and take last.
        allowPickup: (() => {
            const vals = formData.getAll("allowPickup");
            return vals.length > 0 ? vals[vals.length - 1] : null;
        })(),
        latitude: formData.get("latitude"),
        longitude: formData.get("longitude"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        ownerPhone: formData.get("ownerPhone"),
        instagramUrl: formData.get("instagramUrl"),
        facebookUrl: formData.get("facebookUrl"),
        whatsappNumber: formData.get("whatsappNumber"),
    };

    // Convert null → undefined so Zod .optional() works correctly
    const rawData = Object.fromEntries(
        Object.entries(allFields).filter(([_, v]) => v !== null)
    );

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
                    // Only update fields that were actually sent in the form (undefined fields are skipped by Prisma)
                    ...(data.name !== undefined && { name: data.name, businessName: data.name }),
                    ...(data.description !== undefined && { description: data.description || null }),
                    ...(data.image !== undefined && { image: data.image || null }),
                    ...(data.email !== undefined && { email: data.email || null }),
                    ...(data.phone !== undefined && { phone: data.phone || null }),
                    ...(data.address !== undefined && { address: data.address || null }),
                    ...(data.category !== undefined && { category: data.category || "Otro" }),
                    ...(data.deliveryTimeMin !== undefined && { deliveryTimeMin: data.deliveryTimeMin || 30 }),
                    ...(data.deliveryTimeMax !== undefined && { deliveryTimeMax: data.deliveryTimeMax || 45 }),
                    ...(data.deliveryFee !== undefined && { deliveryFee: data.deliveryFee || 0 }),
                    ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount || 0 }),
                    ...(data.deliveryRadiusKm !== undefined && { deliveryRadiusKm: data.deliveryRadiusKm || 5 }),
                    ...(data.allowPickup !== undefined && { allowPickup: data.allowPickup }),
                    // Solo actualizar coords si se envió address en el form (MiComercioForm sí, SettingsForm no)
                    ...(data.address !== undefined && {
                        latitude: finalLatitude,
                        longitude: finalLongitude,
                    }),
                    ...(data.instagramUrl !== undefined && { instagramUrl: data.instagramUrl || null }),
                    ...(data.facebookUrl !== undefined && { facebookUrl: data.facebookUrl || null }),
                    ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber || null }),
                },
            }),
            // Only update owner fields if they were sent (MiComercioForm sends them, SettingsForm does not)
            ...(data.firstName !== undefined || data.lastName !== undefined || data.ownerPhone !== undefined ? [
                prisma.user.update({
                    where: { id: session.user.id },
                    data: {
                        ...(data.firstName !== undefined && { firstName: data.firstName }),
                        ...(data.lastName !== undefined && { lastName: data.lastName }),
                        ...(data.firstName !== undefined && data.lastName !== undefined && {
                            name: `${data.firstName?.trim()} ${data.lastName?.trim()}`
                        }),
                        ...(data.ownerPhone !== undefined && { phone: data.ownerPhone }),
                    }
                })
            ] : [])
        ]);

        revalidatePath("/comercios/configuracion");
        revalidatePath("/comercios/mi-comercio");
        revalidatePath("/comercios");
        return { success: true };
    } catch (error) {
        console.error("Error updating merchant:", error);
        return { error: "Error al actualizar el comercio." };
    }
}

const timeRangeSchema = z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
    close: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
}).refine(
    (r) => r.open < r.close,
    { message: "La hora de apertura debe ser anterior a la de cierre" }
);

const scheduleJsonSchema = z.record(
    z.string().regex(/^[1-7]$/),
    z.union([
        z.array(timeRangeSchema).min(1).max(3),
        z.null(),
    ])
).refine(
    (schedule) => {
        // Validar que turnos no se solapen dentro del mismo día
        for (const key of Object.keys(schedule)) {
            const ranges = schedule[key];
            if (!ranges || ranges.length <= 1) continue;
            const sorted = [...ranges].sort((a, b) => a.open.localeCompare(b.open));
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i].open < sorted[i - 1].close) {
                    return false; // Solapamiento detectado
                }
            }
        }
        return true;
    },
    { message: "Los turnos de un mismo día no pueden solaparse" }
);

export async function updateMerchantSchedule(scheduleEnabled: boolean, scheduleJson: string | null) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
        return { error: "No autorizado" };
    }

    try {
        // Validar scheduleJson si viene
        if (scheduleJson) {
            const parsed = JSON.parse(scheduleJson);
            const validation = scheduleJsonSchema.safeParse(parsed);
            if (!validation.success) {
                return { error: validation.error.issues[0]?.message || "Horarios inválidos" };
            }
        }

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
        });

        if (!merchant) {
            return { error: "No se encontró un comercio asociado a tu cuenta." };
        }

        await prisma.merchant.update({
            where: { id: merchant.id },
            data: { scheduleEnabled, scheduleJson },
        });

        revalidatePath("/comercios/configuracion");
        return { success: true };
    } catch (error) {
        console.error("Error updating schedule:", error);
        return { error: "Error al actualizar los horarios." };
    }
}

export async function toggleMerchantOpen(isOpen: boolean) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
        return { error: "No autorizado" };
    }

    try {
        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            include: {
                products: { where: { isActive: true }, select: { id: true }, take: 3 },
            },
        });

        if (!merchant) {
            return { error: "No se encontró un comercio asociado a tu cuenta." };
        }

        // Si quiere ABRIR la tienda, verificar requisitos obligatorios
        if (isOpen) {
            const missing: string[] = [];

            // Documentación fiscal obligatoria
            if (!merchant.cuit) missing.push("CUIT");
            if (!merchant.bankAccount) missing.push("CBU o Alias bancario");
            if (!merchant.constanciaAfipUrl) missing.push("Constancia AFIP");
            if (!merchant.habilitacionMunicipalUrl) missing.push("Habilitación Municipal");

            // Configuración operativa obligatoria
            if (!merchant.scheduleJson) missing.push("Horarios de atención");
            if (merchant.products.length < 1) missing.push("Al menos 1 producto publicado");
            if (!merchant.address || !merchant.latitude) missing.push("Dirección del comercio");

            if (missing.length > 0) {
                return {
                    error: `No podés abrir tu tienda todavía. Te falta completar: ${missing.join(", ")}. Revisá la guía paso a paso en tu panel.`,
                    missingRequirements: missing,
                };
            }
        }

        await prisma.merchant.update({
            where: { id: merchant.id },
            data: { isOpen },
        });

        revalidatePath("/comercios/configuracion");
        revalidatePath("/comercios/mi-comercio");
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


