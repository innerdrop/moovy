// API Route: User Addresses
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

        const data = await request.json();

        // ── Dedup de contenido ─────────────────────────────────────────
        // Prevenir que el usuario cree direcciones duplicadas por click repetido.
        // Dedup por (userId, label, street, number, apartment). Así "Casa" y
        // "Trabajo" en el mismo lugar siguen siendo válidos (labels distintos),
        // pero "Casa" + "Casa" en el mismo lugar se rechaza como duplicado.
        const normalizedLabel = (data.label || "Casa").trim();
        const normalizedStreet = (data.street || "").trim();
        const normalizedNumber = (data.number || "").trim();
        const normalizedApartment = (data.apartment || "").trim() || null;

        if (!normalizedStreet || !normalizedNumber) {
            return NextResponse.json(
                { error: "Calle y número son obligatorios" },
                { status: 400 }
            );
        }

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
                    neighborhood: data.neighborhood || null,
                    city: data.city || "Ushuaia",
                    province: data.province || "Tierra del Fuego",
                    zipCode: data.zipCode || null,
                    latitude: data.latitude || null,
                    longitude: data.longitude || null,
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

