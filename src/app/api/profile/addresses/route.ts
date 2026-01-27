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
            where: { userId: session.user.id },
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
                    label: data.label || "Casa",
                    street: data.street,
                    number: data.number,
                    apartment: data.apartment || null,
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

