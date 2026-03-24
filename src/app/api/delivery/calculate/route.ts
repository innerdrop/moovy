// API Route: Calculate Delivery Cost (with geocoding)
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateDistance, calculateDeliveryCost, DeliverySettings } from "@/lib/delivery";
import { deliveryLogger } from "@/lib/logger";

const DeliveryCalcSchema = z.object({
    destinationLat: z.number().optional(),
    destinationLng: z.number().optional(),
    address: z.object({
        street: z.string(),
        number: z.string().optional(),
        city: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
    }).optional(),
    merchantId: z.string().min(1, "merchantId requerido"),
    orderTotal: z.number().min(0).optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = DeliveryCalcSchema.safeParse(body);

        if (!validation.success) {
            const message = validation.error.issues[0]?.message || "Datos inválidos";
            return NextResponse.json(
                { success: false, error: message },
                { status: 400 }
            );
        }

        const { destinationLat, destinationLng, address, merchantId, orderTotal = 0 } = validation.data;

        // Extract lat/lng from root or nested address object
        let lat = destinationLat || address?.latitude;
        let lng = destinationLng || address?.longitude;

        // If address text is provided but coordinates are missing, do geocoding
        if (address && (!lat || !lng)) {
            const cityName = address.city || "Ushuaia";
            const fullAddress = address.number
                ? `${address.street} ${address.number}, ${cityName}, Argentina`
                : `${address.street}, ${cityName}, Argentina`;
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

            const geoResponse = await fetch(geocodeUrl);
            const geoData = await geoResponse.json();

            if (geoData.status === "OK" && geoData.results.length > 0) {
                lat = geoData.results[0].geometry.location.lat;
                lng = geoData.results[0].geometry.location.lng;
            } else {
                return NextResponse.json({
                    distanceKm: 0,
                    totalCost: 0,
                    isWithinRange: false,
                    isFreeDelivery: false,
                    message: "No pudimos encontrar la ubicación exacta. Por favor, verificá la dirección.",
                });
            }
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

        if (!settings) throw new Error("Configuración no encontrada");

        // Determine origin (Strictly from Merchant now, no global fallback)
        let originLat: number | null = null;
        let originLng: number | null = null;
        let originAddress: string | null = null;

        const merchant = await prisma.merchant.findUnique({
            where: { id: merchantId },
            select: { latitude: true, longitude: true, address: true, name: true }
        });

        if (!merchant) {
            deliveryLogger.warn({ merchantId }, "Merchant not found");
            return NextResponse.json({
                distanceKm: 0,
                totalCost: 0,
                isWithinRange: false,
                isFreeDelivery: false,
                message: "El comercio asociado no existe.",
            });
        }

        // Check if merchant has VALID coordinates (not null, not 0,0 which is middle of ocean)
        const hasValidCoords =
            merchant.latitude !== null &&
            merchant.longitude !== null &&
            merchant.latitude !== 0 &&
            merchant.longitude !== 0 &&
            // Must be in Argentina region roughly
            merchant.latitude < -20 && merchant.latitude > -60 &&
            merchant.longitude < -50 && merchant.longitude > -80;

        if (hasValidCoords) {
            originLat = merchant.latitude as number;
            originLng = merchant.longitude as number;
            originAddress = merchant.address || merchant.name;
            deliveryLogger.info(
                { merchantId, merchantName: merchant.name, lat: originLat, lng: originLng },
                "Origin set from merchant coordinates"
            );
        } else if (merchant.address) {
            // Try to geocode merchant address if coords are missing or invalid
            deliveryLogger.info(
                { merchantId, address: merchant.address },
                "Merchant lacks valid coordinates, geocoding"
            );
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(merchant.address + ", Ushuaia, Argentina")}&key=${apiKey}`;

            try {
                const geoResponse = await fetch(geocodeUrl);
                const geoData = await geoResponse.json();

                if (geoData.status === "OK" && geoData.results.length > 0) {
                    originLat = geoData.results[0].geometry.location.lat;
                    originLng = geoData.results[0].geometry.location.lng;
                    originAddress = merchant.address;
                    deliveryLogger.info(
                        { merchantId, lat: originLat, lng: originLng },
                        "Merchant geocoded successfully"
                    );
                }
            } catch (geoErr) {
                deliveryLogger.error(
                    { merchantId, error: geoErr instanceof Error ? geoErr.message : String(geoErr) },
                    "Geocoding error for merchant"
                );
            }
        }

        if (!originLat || !originLng) {
            deliveryLogger.error(
                { merchantId, merchantName: merchant.name },
                "Could not determine origin for merchant"
            );
            return NextResponse.json({
                distanceKm: 0,
                totalCost: 0,
                isWithinRange: false,
                isFreeDelivery: false,
                message: "El comercio no tiene una ubicación válida configurada.",
            });
        }

        deliveryLogger.debug(
            { originLat, originLng, destinationLat: lat, destinationLng: lng },
            "Calculating delivery"
        );

        // --- REAL ROAD DISTANCE: Google Distance Matrix ---
        let distanceKm = 0;
        let isRealRoadDistance = false;

        try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

            // Build Distance Matrix URL with explicit driving mode
            const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${lat},${lng}&mode=driving&units=metric&key=${apiKey}`;

            deliveryLogger.debug(
                { origin: originAddress },
                "Requesting distance matrix"
            );

            const distRes = await fetch(distUrl);
            const distData = await distRes.json();

            if (distData.status === "OK" && distData.rows[0].elements[0].status === "OK") {
                // Distance value is in meters, convert to km
                const distanceMeters = distData.rows[0].elements[0].distance.value;
                distanceKm = distanceMeters / 1000;
                isRealRoadDistance = true;
                deliveryLogger.info(
                    { distanceKm: parseFloat(distanceKm.toFixed(2)), source: "google-distance-matrix" },
                    "Road distance calculated"
                );
            } else {
                deliveryLogger.warn(
                    { status: distData.status },
                    "Distance Matrix API failed, using Haversine fallback"
                );
                // Fallback to Haversine (straight line) if API fails
                distanceKm = calculateDistance(originLat, originLng, lat, lng);
            }
        } catch (e) {
            deliveryLogger.error(
                { error: e instanceof Error ? e.message : String(e) },
                "Error calling Distance Matrix API"
            );
            distanceKm = calculateDistance(originLat, originLng, lat, lng);
        }

        const deliverySettings: DeliverySettings = {
            fuelPricePerLiter: settings.fuelPricePerLiter,
            fuelConsumptionPerKm: settings.fuelConsumptionPerKm,
            baseDeliveryFee: settings.baseDeliveryFee,
            maintenanceFactor: settings.maintenanceFactor,
            freeDeliveryMinimum: settings.freeDeliveryMinimum,
            maxDeliveryDistance: settings.maxDeliveryDistance,
            originLat,
            originLng,
        };

        const result = calculateDeliveryCost(distanceKm, deliverySettings, orderTotal);

        return NextResponse.json({
            ...result,
            storeAddress: originAddress,
            isRealRoadDistance,
            message: result.isWithinRange
                ? result.isFreeDelivery
                    ? "¡Envío gratis!"
                    : isRealRoadDistance
                        ? `Costo de envío (recorrido real): $${result.totalCost}`
                        : `Costo de envío (estimado): $${result.totalCost}`
                : "Lo sentimos, la dirección está fuera de nuestra zona de delivery",
        });
    } catch (error) {
        deliveryLogger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "Error calculating delivery"
        );
        return NextResponse.json({
            success: false,
            distanceKm: 0,
            totalCost: 0,
            isWithinRange: false,
            isFreeDelivery: false,
            message: "Error al calcular el envío. Intenta de nuevo.",
        });
    }
}
