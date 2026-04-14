// Admin Product API
//
// Modelo de moderación OPS:
// - Productos de comercio (merchantId != null): OPS SOLO puede modificar
//   isActive, isFeatured y categorías (taxonomía de plataforma).
//   Los campos de contenido del comercio (name, description, price, costPrice,
//   stock, minStock, images) quedan read-only. Si se envían son ignorados.
//   Razón: responsabilidad legal del comercio sobre su contenido, confianza,
//   escalabilidad. Emergencias: desactivar + contactar al comercio.
//
// - Productos master (merchantId == null): creados por OPS, OPS los edita sin
//   restricción porque es el dueño del contenido.
//
// DELETE: soft-delete real (deletedAt/deletedBy/deletedReason) + audit log.
// Los productos eliminados se filtran en GETs y no vuelven a aparecer.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// GET - Get single product
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await auth();
        const isAdmin = hasAnyRole(session, ["ADMIN"]);

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                categories: { include: { category: true } },
                variants: true,
                images: true,
                merchant: { select: { id: true, name: true } },
            },
        });

        if (!product || (product as any).deletedAt) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        // Hide inactive products from non-admins
        if (!product.isActive && !isAdmin) {
            return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 });
    }
}

// Fields OPS always controls (platform-level)
const PLATFORM_FIELDS = new Set(["isActive", "isFeatured"]);
// Fields that only OPS can edit on MASTER products (merchantId === null)
// Never on merchant products (quedan read-only).
const MERCHANT_CONTENT_FIELDS = new Set([
    "name",
    "slug",
    "description",
    "price",
    "costPrice",
    "stock",
    "minStock",
    "imageUrl",
    "image",
]);

/**
 * Builds the Prisma update payload respecting strict moderation rules.
 * Returns { updateData, rejectedFields } — rejectedFields se loggea para auditar
 * intentos de modificación de contenido protegido.
 */
function buildUpdatePayload(
    data: any,
    isMerchantProduct: boolean,
): { updateData: any; categoryUpdate: any | null; imageUrlUpdate: string | null | undefined; rejectedFields: string[] } {
    const updateData: any = {};
    const rejectedFields: string[] = [];

    // Platform fields: siempre permitidos
    if (typeof data.isActive === "boolean") updateData.isActive = data.isActive;
    if (typeof data.isFeatured === "boolean") updateData.isFeatured = data.isFeatured;

    // Merchant content fields: permitidos SOLO si es producto master
    for (const field of MERCHANT_CONTENT_FIELDS) {
        if (data[field] === undefined) continue;
        if (isMerchantProduct) {
            rejectedFields.push(field);
            continue;
        }
        // Master product: OPS puede editar
        if (field === "price" || field === "costPrice") {
            const parsed = parseFloat(data[field]);
            if (!isNaN(parsed)) updateData[field] = parsed;
        } else if (field === "stock" || field === "minStock") {
            const parsed = parseInt(data[field]);
            if (!isNaN(parsed)) updateData[field] = parsed;
        } else if (field === "imageUrl" || field === "image") {
            // imageUrl se maneja aparte (afecta ProductImage)
            continue;
        } else {
            updateData[field] = data[field];
        }
    }

    // Categorías: siempre editable (es taxonomía de plataforma, no contenido del comercio)
    let categoryUpdate: any = null;
    if (data.categoryId) {
        categoryUpdate = {
            deleteMany: {},
            create: [{ category: { connect: { id: data.categoryId } } }],
        };
    } else if (data.categoryIds && Array.isArray(data.categoryIds)) {
        categoryUpdate = {
            deleteMany: {},
            create: data.categoryIds.map((catId: string) => ({
                category: { connect: { id: catId } },
            })),
        };
    }

    // imageUrl solo para productos master
    let imageUrlUpdate: string | null | undefined = undefined;
    if (!isMerchantProduct && data.imageUrl !== undefined) {
        imageUrlUpdate = data.imageUrl || null;
    } else if (isMerchantProduct && data.imageUrl !== undefined) {
        rejectedFields.push("imageUrl");
    }

    return { updateData, categoryUpdate, imageUrlUpdate, rejectedFields };
}

async function updateProduct(id: string, data: any, adminId: string) {
    // Leemos el producto ANTES para saber si es de comercio o master
    const existing = await prisma.product.findUnique({
        where: { id },
        select: { id: true, merchantId: true, deletedAt: true, name: true },
    });

    if (!existing || (existing as any).deletedAt) {
        return { error: "Producto no encontrado", status: 404 as const };
    }

    const isMerchantProduct = !!existing.merchantId;

    const { updateData, categoryUpdate, imageUrlUpdate, rejectedFields } =
        buildUpdatePayload(data, isMerchantProduct);

    if (categoryUpdate) updateData.categories = categoryUpdate;

    if (Object.keys(updateData).length === 0 && imageUrlUpdate === undefined) {
        return { error: "No hay cambios válidos para aplicar", status: 400 as const };
    }

    // Handle image URL update solo si aplicable (producto master)
    if (imageUrlUpdate !== undefined) {
        await prisma.productImage.deleteMany({ where: { productId: id } });
        if (imageUrlUpdate) {
            await prisma.productImage.create({
                data: { url: imageUrlUpdate, productId: id, order: 0 },
            });
        }
    }

    const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { categories: true, images: true },
    });

    // Audit: si OPS intentó modificar campos protegidos de un producto de comercio,
    // queda registro. No bloquea la operación (simplemente se ignoran).
    if (rejectedFields.length > 0) {
        await logAudit({
            action: "PRODUCT_UPDATE_REJECTED_FIELDS",
            entityType: "Product",
            entityId: id,
            userId: adminId,
            details: {
                rejectedFields,
                reason: "Producto de comercio: contenido del merchant no es editable por OPS",
                merchantId: existing.merchantId,
            },
        });
    }

    return { product };
}

// PUT - Update product (Admin only)
export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const adminId = session.user?.id;
        if (!adminId) {
            return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
        }

        const { id } = await context.params;
        const data = await request.json();

        const result = await updateProduct(id, data, adminId);
        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.product);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
    }
}

// PATCH - Alias para PUT
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    return PUT(request, context);
}

// DELETE - Soft delete con razón opcional + audit log
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const adminId = session.user?.id;
        if (!adminId) {
            return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
        }

        const { id } = await context.params;

        const existing = await prisma.product.findUnique({
            where: { id },
            select: { id: true, name: true, merchantId: true, deletedAt: true },
        });

        if (!existing) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }
        if ((existing as any).deletedAt) {
            return NextResponse.json({ error: "Este producto ya fue eliminado" }, { status: 410 });
        }

        // Reason opcional
        let reason: string | null = null;
        try {
            const body = await request.json();
            if (body?.reason && typeof body.reason === "string" && body.reason.trim()) {
                reason = body.reason.trim().slice(0, 500);
            }
        } catch {
            // body vacío o sin content-type — OK
        }

        await prisma.product.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedBy: adminId,
                deletedReason: reason,
                isActive: false,
            },
        });

        await logAudit({
            action: "PRODUCT_DELETE",
            entityType: "Product",
            entityId: id,
            userId: adminId,
            details: {
                name: existing.name,
                merchantId: existing.merchantId,
                reason: reason || null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
    }
}
