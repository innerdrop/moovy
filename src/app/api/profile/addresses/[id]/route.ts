// API Route: Single Address Operations
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ISSUE-017: mismo regex que POST /api/profile/addresses
// Letras (incluye acentos y ñ), dígitos, espacios y puntuación común de direcciones.
// Rechaza <, >, {, }, backticks, comillas, $, &, etc. para prevenir XSS stored.
const SAFE_TEXT_REGEX = /^[\p{L}\p{N}\s.,#\-/()°º'ª]+$/u;

const AddressTextFieldOptional = z
    .string()
    .trim()
    .max(150, "Máximo 150 caracteres")
    .regex(SAFE_TEXT_REGEX, "Contiene caracteres no permitidos")
    .optional()
    .or(z.literal(""))
    .nullable();

const AddressPatchSchema = z.object({
    label: AddressTextFieldOptional,
    street: AddressTextFieldOptional,
    number: AddressTextFieldOptional,
    apartment: AddressTextFieldOptional,
    neighborhood: AddressTextFieldOptional,
    city: AddressTextFieldOptional,
    province: AddressTextFieldOptional,
    zipCode: z
        .string()
        .trim()
        .max(12, "Código postal inválido")
        .regex(/^[A-Za-z0-9\s\-]+$/, "Código postal inválido")
        .optional()
        .or(z.literal(""))
        .nullable(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    isDefault: z.boolean().optional(),
});

// GET - Get single address
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;

        const address = await prisma.address.findUnique({
            where: {
                id: id,
                // Ensure ownership implicitly? No, findUnique only keys by ID. 
                // We must check userId after or use findFirst. 
            }
        });

        if (!address || address.userId !== session.user.id) {
            return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
        }

        return NextResponse.json(address);

    } catch (error) {
        console.error("Error fetching address:", error);
        return NextResponse.json({ error: "Error al obtener dirección" }, { status: 500 });
    }
}

// PATCH - Update address
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const raw = await request.json();

        // ISSUE-017: validación estricta contra XSS stored
        const validation = AddressPatchSchema.safeParse(raw);
        if (!validation.success) {
            const message = validation.error.issues[0]?.message || "Datos inválidos";
            return NextResponse.json(
                { error: message, field: validation.error.issues[0]?.path?.join(".") },
                { status: 400 }
            );
        }
        const data = validation.data;

        // Check ownership first
        const existing = await prisma.address.findUnique({
            where: { id }
        });

        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            if (data.isDefault) {
                // Disable other defaults
                await tx.address.updateMany({
                    where: { userId: session.user.id, isDefault: true, id: { not: id } },
                    data: { isDefault: false }
                });
            }

            return await tx.address.update({
                where: { id },
                data: {
                    // Prisma ignora undefined en update → solo updatea los campos que vinieron
                    label: data.label ?? undefined,
                    street: data.street ?? undefined,
                    number: data.number ?? undefined,
                    apartment: data.apartment ?? undefined,
                    neighborhood: data.neighborhood ?? undefined,
                    city: data.city ?? undefined,
                    province: data.province ?? undefined,
                    zipCode: data.zipCode ?? undefined,
                    latitude: data.latitude ?? undefined,
                    longitude: data.longitude ?? undefined,
                    isDefault: data.isDefault ?? undefined,
                }
            });
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error updating address:", error);
        return NextResponse.json({ error: "Error al actualizar dirección" }, { status: 500 });
    }
}

// DELETE - Delete address
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;

        // Verify ownership via deleteMany count or findFirst
        // prisma.address.delete({ where: { id } }) doesn't check userId check unless we verify first.

        const existing = await prisma.address.findFirst({
            where: { id, userId: session.user.id }
        });

        if (!existing) {
            return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
        }

        await prisma.address.update({
            where: { id },
            data: {
                // @ts-ignore
                deletedAt: new Date(),
                isDefault: false // Clear default status if deleted
            }
        });

        return NextResponse.json({ success: true, message: "Dirección eliminada" });

    } catch (error) {
        console.error("Error deleting address:", error);
        return NextResponse.json({ error: "Error al eliminar dirección" }, { status: 500 });
    }
}
