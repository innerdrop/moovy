// API Route: Calculate Delivery Cost (with geocoding)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance, calculateDeliveryCost, DeliverySettings } from "@/lib/delivery";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { destinationLat, destinationLng, address, merchantId, orderTotal = 0 } = body;

        let lat = destinationLat;
        let lng = destinationLng;

        // If address is provided instead of coordinates, do geocoding
        if (address && (!lat || !lng)) {
            const fullAddress = `${address.street} ${address.number}, ${address.city}, Argentina`;
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`;

            const geoResponse = await fetch(geocodeUrl, {
                headers: {
                    "User-Agent": "Moovy/1.0 (contact@moovy.com.ar)",
                    "Accept-Language": "es"
                }
            });

            if (!geoResponse.ok) {
                return NextResponse.json({
                    distanceKm: 0,
                    totalCost: 0,
                    isWithinRange: false,
                    isFreeDelivery: false,
                    message: "Error al buscar la dirección. Intenta de nuevo.",
                });
            }

            const geoData = await geoResponse.json();

            if (!geoData || geoData.length === 0) {
                return NextResponse.json({
                    distanceKm: 0,
                    totalCost: 0,
                    isWithinRange: false,
                    isFreeDelivery: false,
                    message: "No pudimos encontrar la dirección. Por favor, verificá los datos.",
                });
            }

            lat = geoData[0].lat;
            lng = geoData[0].lon;
        }

        if (!lat || !lng) {
            return NextResponse.json(
                { error: "Se requieren coordenadas de destino o dirección" },
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

        // Determine origin (Merchant or Global Store)
        let originLat = settings.originLat;
        let originLng = settings.originLng;
        let originAddress = settings.storeAddress;

        if (merchantId) {
            const merchant = await prisma.merchant.findUnique({
                where: { id: merchantId },
                select: { latitude: true, longitude: true, address: true, name: true }
            });

            if (merchant?.latitude && merchant?.longitude) {
                originLat = merchant.latitude;
                originLng = merchant.longitude;
                originAddress = merchant.address || merchant.name;
                console.log(`[Delivery] Using merchant origin for ${merchant.name}: ${originLat}, ${originLng}`);
            }
        }

        // Calculate distance from origin to destination
        const distanceKm = calculateDistance(
            originLat,
            originLng,
            parseFloat(lat),
            parseFloat(lng)
        );

        // Build delivery settings object
        const deliverySettings: DeliverySettings = {
            fuelPricePerLiter: settings.fuelPricePerLiter,
            fuelConsumptionPerKm: settings.fuelConsumptionPerKm,
            baseDeliveryFee: settings.baseDeliveryFee,
            maintenanceFactor: settings.maintenanceFactor,
            freeDeliveryMinimum: settings.freeDeliveryMinimum,
            maxDeliveryDistance: settings.maxDeliveryDistance,
            originLat: originLat,
            originLng: originLng,
        };

        // Calculate delivery cost
        const result = calculateDeliveryCost(
            distanceKm,
            deliverySettings,
            parseFloat(orderTotal)
        );

        return NextResponse.json({
            ...result,
            storeAddress: originAddress,
            message: result.isWithinRange
                ? result.isFreeDelivery
                    ? "¡Envío gratis!"
                    : `Costo de envío: $${result.totalCost}`
                : "Lo sentimos, la dirección está fuera de nuestra zona de delivery",
        });
    } catch (error) {
        console.error("Error calculating delivery:", error);
        return NextResponse.json({
            distanceKm: 0,
            totalCost: 0,
            isWithinRange: false,
            isFreeDelivery: false,
            message: "Error al calcular el envío. Intenta de nuevo.",
        });
    }
}
