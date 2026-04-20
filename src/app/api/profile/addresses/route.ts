// API Route: User Addresses
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ISSUE-017: validación estricta contra XSS stored.
// Letras (incluye acentos y ñ), dígitos, espacios y puntuación común de direcciones.
// Rechaza <, >, {, }, backticks, comillas, $, &, etc. para prevenir inyecciones.
const SAFE_TEXT_REGEX = /^[\p{L}\p{N}\s.,#\-/()°º'ª]+$/u;

const AddressTextField = z
    .string()
    .trim()
    .min(1, "Campo requerido")
    .max(150, "Máximo 150 caracteres")
    .regex(SAFE_TEXT_REGEX, "Contiene caracteres no permitidos");

const AddressTextFieldOptional = z
    .string()
    .trim()
    .max(150, "Máximo 150 caracteres")
    .regex(SAFE_TEXT_REGEX, "Contiene caracteres no permitidos")
    .optional()
    .or(z.literal(""))
    .nullable();

const ZipCodeField = z
    .string()
    .trim()
    .max(12, "Código postal inválido")
    .regex(/^[A-Za-z0-9\s\-]+$/, "Código postal inválido")
    .optional()
    .or(z.literal(""))
    .nullable();

const AddressCreateSchema = z.object({
    label: AddressTextField.default("Casa"),
    street: AddressTextField,
    number: AddressTextField,
    apartment: AddressTextFieldOptional,
    neighborhood: AddressTextFieldOptional,
    city: AddressTextFieldOptional,
    province: AddressTextFieldOptional,
    zipCode: ZipCodeField,
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    isDefault: z.boolean().optional(),
});

// GET - Get all user addresses
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const addresses = await prisma.address.findMany({
            where: {
                userId: session.user.id,
                // @ts-ignore - added to schema, may need reload
                deletedAt: null
            },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json(addresses);

    } catch (error) {
        console.error("Error fetching addresses:", error);
        return NextResponse.json({ error: "Error al obtener direcciones" }, { status: 500 });
    }
}

// POST - Create new address
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const raw = await request.json();

        // ISSUE-017: validar con Zod antes de tocar la DB
        const validation = AddressCreateSchema.safeParse(raw);
        if (!validation.success) {
            const message = validation.error.issues[0]?.message || "Datos inválidos";
            return NextResponse.json(
                { error: message, field: validation.error.issues[0]?.path?.join(".") },
                { status: 400 }
            );
        }
        const data = validation.data;

        // ── Dedup de contenido ─────────────────────────────────────────
        // Prevenir que el usuario cree direcciones duplicadas por click repetido.
        // Dedup por (userId, label, street, number, apartment). Así "Casa" y
        // "Trabajo" en el mismo lugar siguen siendo válidos (labels distintos),
        // pero "Casa" + "Casa" en el mismo lugar se rechaza como duplicado.
        const normalizedLabel = data.label;
        const normalizedStreet = data.street;
        const normalizedNumber = data.number;
        const normalizedApartment = (data.apartment && data.apartment.length > 0) ? data.apartment : null;

        const existing = await prisma.address.findFirst({
            where: {
                userId: session.user.id,
                deletedAt: null,
                label: normalizedLabel,
                street: normalizedStreet,
                number: normalizedNumber,
                apartment: normalizedApartment,
            },
            select: { id: true, label: true },
        });

        if (existing) {
            return NextResponse.json(
                {
                    error: "Ya tenés guardada una dirección con esta etiqueta en el mismo lugar",
                    existingId: existing.id,
                },
                { status: 409 }
            );
        }

        // Use transaction if setting default
        const result = await prisma.$transaction(async (tx) => {
            if (data.isDefault) {
                // Unset other defaults
                await tx.address.updateMany({
                    where: { userId: session.user.id, isDefault: true },
                    data: { isDefault: false }
                });
            }

            return await tx.address.create({
                data: {
                    userId: session.user.id,
                    label: normalizedLabel,
                    street: normalizedStreet,
                    number: normalizedNumber,
                    apartment: normalizedApartment,
                    neighborhood: (data.neighborhood && data.neighborhood.length > 0) ? data.neighborhood : null,
                    city: (data.city && data.city.length > 0) ? data.city : "Ushuaia",
                    province: (data.province && data.province.length > 0) ? data.province : "Tierra del Fuego",
                    zipCode: (data.zipCode && data.zipCode.length > 0) ? data.zipCode : null,
                    latitude: data.latitude ?? null,
                    longitude: data.longitude ?? null,
                    isDefault: data.isDefault || false
                }
            });
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error("Error creating address:", error);
        return NextResponse.json({ error: "Error al crear dirección" }, { status: 500 });
    }
}

