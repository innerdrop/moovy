// API Route: Calculate Delivery Cost
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance, calculateDeliveryCost, DeliverySettings } from "@/lib/delivery";

export async function POST(request: Request) {
    try {
        const { destinationLat, destinationLng, orderTotal = 0 } = await request.json();

        if (!destinationLat || !destinationLng) {
            return NextResponse.json(
                { error: "Se requieren coordenadas de destino" },
                { status: 400 }
            );
        }

        // Get store settings
        const settings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
        });

        if (!settings) {
            return NextResponse.json(
                { error: "Configuración de tienda no encontrada" },
                { status: 500 }
            );
        }

        // Calculate distance from store to destination
        const distanceKm = calculateDistance(
            settings.originLat,
            settings.originLng,
            parseFloat(destinationLat),
            parseFloat(destinationLng)
        );

        // Build delivery settings object
        const deliverySettings: DeliverySettings = {
            fuelPricePerLiter: settings.fuelPricePerLiter,
            fuelConsumptionPerKm: settings.fuelConsumptionPerKm,
            baseDeliveryFee: settings.baseDeliveryFee,
            maintenanceFactor: settings.maintenanceFactor,
            freeDeliveryMinimum: settings.freeDeliveryMinimum,
            maxDeliveryDistance: settings.maxDeliveryDistance,
            originLat: settings.originLat,
            originLng: settings.originLng,
        };

        // Calculate delivery cost
        const result = calculateDeliveryCost(
            distanceKm,
            deliverySettings,
            parseFloat(orderTotal)
        );

        return NextResponse.json({
            ...result,
            storeAddress: settings.storeAddress,
            message: result.isWithinRange
                ? result.isFreeDelivery
                    ? "¡Envío gratis!"
                    : `Costo de envío: $${result.totalCost}`
                : "Lo sentimos, la dirección está fuera de nuestra zona de delivery",
        });
    } catch (error) {
        console.error("Error calculating delivery:", error);
        return NextResponse.json(
            { error: "Error al calcular envío" },
            { status: 500 }
        );
    }
}

