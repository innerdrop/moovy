// API Route: Store Settings Update
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch current settings
export async function GET() {
    try {
        let settings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
        });

        if (!settings) {
            settings = await prisma.storeSettings.create({
                data: { id: "settings" },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Error al obtener configuración" },
            { status: 500 }
        );
    }
}

// PUT - Update settings (Admin only)
export async function PUT(request: Request) {
    try {
        const session = await auth();

        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const data = await request.json();

        const settings = await prisma.storeSettings.upsert({
            where: { id: "settings" },
            update: {
                isOpen: data.isOpen,
                closedMessage: data.closedMessage,
                fuelPricePerLiter: data.fuelPricePerLiter ? parseFloat(data.fuelPricePerLiter) : undefined,
                fuelConsumptionPerKm: data.fuelConsumptionPerKm ? parseFloat(data.fuelConsumptionPerKm) : undefined,
                baseDeliveryFee: data.baseDeliveryFee ? parseFloat(data.baseDeliveryFee) : undefined,
                maintenanceFactor: data.maintenanceFactor ? parseFloat(data.maintenanceFactor) : undefined,
                freeDeliveryMinimum: data.freeDeliveryMinimum ? parseFloat(data.freeDeliveryMinimum) : null,
                maxDeliveryDistance: data.maxDeliveryDistance ? parseFloat(data.maxDeliveryDistance) : undefined,
                storeName: data.storeName,
                storeAddress: data.storeAddress,
                originLat: data.originLat ? parseFloat(data.originLat) : undefined,
                originLng: data.originLng ? parseFloat(data.originLng) : undefined,
                whatsappNumber: data.whatsappNumber,
                phone: data.phone,
                email: data.email,
            },
            create: {
                id: "settings",
                ...data,
            },
        });

        return NextResponse.json({
            message: "Configuración actualizada",
            settings
        });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { error: "Error al actualizar configuración" },
            { status: 500 }
        );
    }
}
